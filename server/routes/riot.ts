import { Router } from 'express'
import { PLAYERS } from '../../src/constants/players.js'
import { riotClient } from '../riot/client.js'
import { cache, TTL } from '../riot/dataCache.js'
import {
  getAccount, getSummoner, getLeagueEntries,
  getPlayerMatchIds, getMatch,
} from '../db/index.js'
import type { TrackedPlayer, Match, LiveGame } from '../../src/types/riot.js'

export const riotRouter = Router()

// Build a full TrackedPlayer from DB — zero API calls
function buildFromDB(config: typeof PLAYERS[number]): TrackedPlayer | null {
  const key = `${config.gameName}#${config.tagLine}`
  const account = getAccount(key)
  if (!account) return null

  const summoner = getSummoner(account.puuid)
  if (!summoner) return null

  const entries = getLeagueEntries(account.puuid)
  const soloEntry = entries.find(e => e.queueType === 'RANKED_SOLO_5x5') ?? null

  const allMatchIds = getPlayerMatchIds(account.puuid, 420)
  const recentMatches: Match[] = []
  for (const id of allMatchIds) {
    if (recentMatches.length >= 9) break
    const m = getMatch(id)
    if (m && m.info.gameDuration >= 210) recentMatches.push(m)
  }

  return { config, account, summoner, soloEntry, recentMatches, isInGame: false }
}

// Add real-time live game status (cached 30s, one API call per player)
async function withLiveGame(player: TrackedPlayer): Promise<TrackedPlayer> {
  const liveKey = `live:${player.account.puuid}`
  if (cache.has(liveKey)) {
    const cached = cache.get<LiveGame>(liveKey)
    return cached ? { ...player, isInGame: true, liveGame: cached } : player
  }
  try {
    const game = await riotClient.getActiveGameByPuuid(player.account.puuid)
    // Only ranked solo/duo (420) counts — ignore normals, ARAM, flex, etc.
    if (game.gameQueueConfigId !== 420) {
      cache.set(liveKey, null, TTL.LIVE_GAME)
      return player
    }
    const liveGame = game as LiveGame
    cache.set(liveKey, liveGame, TTL.LIVE_GAME)
    return { ...player, isInGame: true, liveGame }
  } catch (e: unknown) {
    // Cache all errors: 404 = confirmed not in game (full TTL), others = short TTL to avoid burning rate limit during outages
    const is404 = e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404
    cache.set(liveKey, null, is404 ? TTL.LIVE_GAME : 15_000)
    return player
  }
}

riotRouter.get('/players', async (_req, res) => {
  const dbPlayers = PLAYERS.map(buildFromDB).filter(Boolean) as TrackedPlayer[]

  if (!dbPlayers.length) {
    // First ever run — DB not yet populated by cron
    res.json([])
    return
  }

  // Live game check is the only real-time API call needed
  const players = await Promise.all(dbPlayers.map(withLiveGame))
  res.json(players)
})

riotRouter.get('/live', async (_req, res) => {
  const dbPlayers = PLAYERS.map(buildFromDB).filter(Boolean) as TrackedPlayer[]
  const players = await Promise.all(dbPlayers.map(withLiveGame))
  res.json(players.filter(p => p.isInGame))
})
