import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { LPSnapshot, LeaderboardStats } from '@/types/riot'

const LP_KEY = 'solowq:lp-history'
const BOARDS_KEY = 'solowq:leaderboards'

// Graph refreshes every 10 min — new LP data written every 90 min, so user
// sees the update within 10 min of the cron writing it.
const POLL_INTERVAL = 10 * 60 * 1000

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeCache(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* quota */ }
}

export function useStats() {
  const [lpHistory, setLpHistory] = useState<LPSnapshot[]>(() => readCache<LPSnapshot[]>(LP_KEY) ?? [])
  const [leaderboards, setLeaderboards] = useState<LeaderboardStats | null>(() => readCache<LeaderboardStats>(BOARDS_KEY))
  const [loading, setLoading] = useState(() => !readCache(LP_KEY) && !readCache(BOARDS_KEY))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchAll = () =>
      Promise.all([api.getLPHistory(), api.getLeaderboards()])
        .then(([history, boards]) => {
          if (cancelled) return
          setLpHistory(history)
          setLeaderboards(boards)
          writeCache(LP_KEY, history)
          writeCache(BOARDS_KEY, boards)
          setError(null)
        })
        .catch(() => { if (!cancelled) setError('Impossible de charger les statistiques.') })
        .finally(() => { if (!cancelled) setLoading(false) })

    fetchAll()
    const id = setInterval(fetchAll, POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return { lpHistory, leaderboards, loading, error }
}
