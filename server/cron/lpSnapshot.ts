import cron from 'node-cron'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { PLAYERS } from '../../src/constants/players.js'
import { riotClient } from '../riot/client.js'
import { computeAbsoluteLP } from '../../src/constants/ranks.js'
import {
  getAccount, saveAccount,
  getSummoner, saveSummoner,
  getLeagueEntries, saveLeagueEntries,
  hasMatch, saveMatch,
  getPlayerMatchIds, savePlayerMatchIds,
} from '../db/index.js'
import type { LPSnapshot, Match } from '../../src/types/riot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LP_FILE = process.env.LP_FILE ?? path.resolve(__dirname, '../../lp_history.json')

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// Season 2026 (Split 1) started January 9, 2026 — pre-season ranked games on Jan 7-8 excluded
const SEASON_2026_START = 1767916800

// ─── Sliding-window rate limiter ──────────────────────────────────────────────
// Riot personal key: 100 req / 2 min. We cap at 90 to keep a safety buffer.
// Every API call goes through rl.wait() — it blocks automatically near the cap.

class RateLimiter {
  private log: number[] = []
  constructor(private readonly max: number, private readonly windowMs: number) {}

  async wait(): Promise<void> {
    while (true) {
      const now = Date.now()
      this.log = this.log.filter(t => now - t < this.windowMs)
      if (this.log.length < this.max) {
        this.log.push(now)
        return
      }
      const waitMs = this.log[0] + this.windowMs - now + 200
      console.log(`[Cron] Cap atteint (${this.log.length}/${this.max}) — attente ${Math.ceil(waitMs / 1000)}s`)
      await delay(waitMs)
    }
  }
}

const rl = new RateLimiter(90, 120_000)

// ─── Infrastructure sync (per player) ────────────────────────────────────────

async function syncPlayer(player: typeof PLAYERS[number]): Promise<void> {
  await rl.wait()
  const account = await riotClient.getAccountByRiotId(player.gameName, player.tagLine)
  saveAccount(`${player.gameName}#${player.tagLine}`, account)

  await rl.wait()
  const summoner = await riotClient.getSummonerByPuuid(account.puuid)
  saveSummoner(summoner)

  await rl.wait()
  const entries = await riotClient.getLeagueEntriesByPuuid(account.puuid)
  saveLeagueEntries(account.puuid, entries)

  const soloEntry = entries.find(e => e.queueType === 'RANKED_SOLO_5x5')
  // Official ranked game count — never fetch more IDs than this to prevent pre-season bleed
  const seasonTotal = soloEntry ? soloEntry.wins + soloEntry.losses : null

  const knownIds = new Set(getPlayerMatchIds(account.puuid, 420))

  if (knownIds.size === 0 || knownIds.size % 100 === 0) {
    // Either cold start OR previously capped at exactly N×100 pages.
    // Paginate from the current count forward to fetch all remaining games.
    let start = knownIds.size === 0 ? 0 : knownIds.size
    let fetched = 0
    while (true) {
      // Stop once we have the full season worth of games
      if (seasonTotal !== null && knownIds.size + fetched >= seasonTotal) break
      await rl.wait()
      const page = await riotClient.getMatchIds(account.puuid, 100, 420, start, SEASON_2026_START)
      const newIds = page.filter(id => !knownIds.has(id))
      if (newIds.length) { savePlayerMatchIds(account.puuid, newIds, 420); fetched += newIds.length }
      if (page.length < 100) break
      start += 100
    }
    if (fetched) console.log(`[Cron] ${player.displayName}: +${fetched} matchs indexés (total ${knownIds.size + fetched})`)

    // Also check for brand-new games at the top (played since last sync)
    await rl.wait()
    const latest = await riotClient.getMatchIds(account.puuid, 100, 420, 0, SEASON_2026_START)
    const newTop = latest.filter(id => !knownIds.has(id))
    if (newTop.length) savePlayerMatchIds(account.puuid, newTop, 420)
  } else {
    // Total is not a multiple of 100 → we already have all historical games.
    // Just check for new ones at the top.
    await rl.wait()
    const latest = await riotClient.getMatchIds(account.puuid, 100, 420, 0, SEASON_2026_START)
    const newIds = latest.filter(id => !knownIds.has(id))
    if (newIds.length) savePlayerMatchIds(account.puuid, newIds, 420)
  }
}

// ─── Match sync — batched concurrent fetching, interleaved across players ─────

const BATCH_SIZE = 5

async function syncAllMissingMatches(): Promise<void> {
  const perPlayer = PLAYERS.map(p => {
    const account = getAccount(`${p.gameName}#${p.tagLine}`)
    if (!account) return [] as string[]
    return getPlayerMatchIds(account.puuid, 420).filter(id => !hasMatch(id))
  })

  const seen = new Set<string>()
  const ordered: string[] = []
  const maxLen = Math.max(...perPlayer.map(ids => ids.length), 0)
  for (let round = 0; round < maxLen; round++) {
    for (const ids of perPlayer) {
      const id = ids[round]
      if (id && !seen.has(id)) { seen.add(id); ordered.push(id) }
    }
  }

  if (!ordered.length) return

  console.log(`[Cron] ${ordered.length} match(es) manquant(s) — téléchargement par lots de ${BATCH_SIZE}`)
  let done = 0

  for (let i = 0; i < ordered.length; i += BATCH_SIZE) {
    const batch = ordered.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async id => {
      if (hasMatch(id)) { done++; return }
      await rl.wait()
      try {
        const match = await riotClient.getMatch(id) as Match
        saveMatch(id, match)
        done++
      } catch { /* skip, retry next cycle */ }
    }))
  }

  console.log(`[Cron] Match sync terminé — ${done}/${ordered.length} — ${new Date().toLocaleString('fr-FR')}`)
}

// ─── Full player sync (every 15 min) ─────────────────────────────────────────

let syncRunning = false

export async function syncAllPlayers(): Promise<void> {
  if (syncRunning) return
  syncRunning = true
  try {
    // Players staggered so their infrastructure calls don't all fire simultaneously
    await Promise.allSettled(
      PLAYERS.map((player, i) =>
        delay(i * 200).then(() => syncPlayer(player)).catch(e =>
          console.error(`[Cron] Erreur — ${player.gameName}#${player.tagLine}:`, e)
        )
      )
    )
    await syncAllMissingMatches()
    console.log(`[Cron] Sync complet — ${new Date().toLocaleString('fr-FR')}`)
  } finally {
    syncRunning = false
  }
}

// ─── LP snapshot (every 90 min) — reads from DB, zero API calls ──────────────

async function readHistory(): Promise<LPSnapshot[]> {
  try {
    return JSON.parse(await fs.readFile(LP_FILE, 'utf-8')) as LPSnapshot[]
  } catch {
    return []
  }
}

export async function takeLPSnapshot(): Promise<void> {
  const history = await readHistory()
  const timestamp = new Date().toISOString()
  let changed = false

  for (const player of PLAYERS) {
    const account = getAccount(`${player.gameName}#${player.tagLine}`)
    if (!account) continue
    const solo = getLeagueEntries(account.puuid).find(e => e.queueType === 'RANKED_SOLO_5x5')
    if (!solo) continue

    history.push({
      puuid: account.puuid,
      gameName: player.gameName,
      tagLine: player.tagLine,
      absoluteLP: computeAbsoluteLP(solo.tier, solo.rank, solo.leaguePoints),
      tier: solo.tier,
      rank: solo.rank,
      leaguePoints: solo.leaguePoints,
      timestamp,
    })
    changed = true
  }

  if (changed) {
    await fs.writeFile(LP_FILE, JSON.stringify(history, null, 2))
    console.log(`[LP] Snapshot — ${new Date(timestamp).toLocaleString('fr-FR')}`)
  }
}

// ─── Startup ──────────────────────────────────────────────────────────────────

export function startCron(): void {
  cron.schedule('*/15 * * * *', () => syncAllPlayers().catch(console.error))
  setInterval(() => takeLPSnapshot().catch(console.error), 90 * 60 * 1000)
  syncAllPlayers().then(() => takeLPSnapshot()).catch(console.error)
}
