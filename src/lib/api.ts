import axios from 'axios'
import type { TrackedPlayer, LPSnapshot, LeaderboardStats } from '@/types/riot'

const client = axios.create({ baseURL: '/api' })

export const api = {
  getPlayers: () =>
    client.get<TrackedPlayer[]>('/players').then(r => r.data),

  getLiveGames: () =>
    client.get<TrackedPlayer[]>('/live').then(r => r.data),

  getLPHistory: () =>
    client.get<LPSnapshot[]>('/stats/lp-history').then(r => r.data),

  getLeaderboards: () =>
    client.get<LeaderboardStats>('/stats/leaderboards').then(r => r.data),

  getDDragonVersion: () =>
    client.get<string>('/ddragon-version').then(r => r.data),
}
