import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { PLAYERS } from '../../src/constants/players.js'
import { getAccount, getSummoner, getPlayerMatchIds, getMatch } from '../db/index.js'
import type { LPSnapshot, LeaderboardStats, Match } from '../../src/types/riot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LP_FILE = process.env.LP_FILE ?? path.resolve(__dirname, '../../lp_history.json')

export const statsRouter = Router()

statsRouter.get('/lp-history', async (_req, res) => {
  try {
    const raw = await fs.readFile(LP_FILE, 'utf-8')
    res.json(JSON.parse(raw) as LPSnapshot[])
  } catch {
    res.json([])
  }
})

statsRouter.get('/leaderboards', (_req, res) => {
  type PlayerStats = {
    puuid: string; displayName: string; twitchLogin?: string; profileIconId?: number;
    kda: number; kills: number; deaths: number; assists: number; csPerMin: number; games: number
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  const data: PlayerStats[] = PLAYERS.flatMap(config => {
    const key = `${config.gameName}#${config.tagLine}`
    const account = getAccount(key)
    if (!account) return []

    const summoner = getSummoner(account.puuid)

    const matchIds = getPlayerMatchIds(account.puuid, 420)
    const matches = (matchIds.map(id => getMatch(id)).filter(Boolean) as Match[])
      .filter(m => m.info.queueId === 420 && m.info.gameDuration >= 210)
    if (!matches.length) return []

    const puuid = account.puuid
    const stats = matches.flatMap(m => {
      const p = m.info.participants.find(x => x.puuid === puuid)
      if (!p) return []
      const csPerMin = (p.totalMinionsKilled + p.neutralMinionsKilled) / Math.max(1, m.info.gameDuration / 60)
      return [{ kills: p.kills, deaths: p.deaths, assists: p.assists, csPerMin, kda: (p.kills + p.assists) / Math.max(1, p.deaths) }]
    })

    if (!stats.length) return []

    return [{
      puuid,
      displayName: config.displayName,
      twitchLogin: config.twitchLogin,
      profileIconId: summoner?.profileIconId,
      kda: avg(stats.map(s => s.kda)),
      kills: sum(stats.map(s => s.kills)),
      deaths: sum(stats.map(s => s.deaths)),
      assists: sum(stats.map(s => s.assists)),
      csPerMin: avg(stats.map(s => s.csPerMin)),
      games: stats.length,
    }]
  })

  const makeEntry = (d: PlayerStats, value: string) => ({
    puuid: d.puuid,
    displayName: d.displayName,
    twitchLogin: d.twitchLogin,
    profileIconId: d.profileIconId,
    value,
    subLabel: `${d.games} parties`,
  })

  const leaderboards: LeaderboardStats = {
    kda:     [...data].sort((a, b) => b.kda - a.kda).map(d => makeEntry(d, d.kda.toFixed(2))),
    kills:   [...data].sort((a, b) => b.kills - a.kills).map(d => makeEntry(d, String(d.kills))),
    deaths:  [...data].sort((a, b) => b.deaths - a.deaths).map(d => makeEntry(d, String(d.deaths))),
    assists: [...data].sort((a, b) => b.assists - a.assists).map(d => makeEntry(d, String(d.assists))),
    csPerMin:[...data].sort((a, b) => b.csPerMin - a.csPerMin).map(d => makeEntry(d, d.csPerMin.toFixed(1))),
  }

  res.json(leaderboards)
})
