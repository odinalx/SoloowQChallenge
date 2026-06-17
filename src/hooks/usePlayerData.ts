import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { PLAYERS } from '@/constants/players'
import type { TrackedPlayer } from '@/types/riot'

const STORAGE_KEY = 'solowq:players:v2'

function readCache(): TrackedPlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TrackedPlayer[]) : []
  } catch {
    return []
  }
}

export function usePlayerData() {
  const [players, setPlayers] = useState<TrackedPlayer[]>(readCache)
  const [loading, setLoading] = useState(() => readCache().length === 0)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await api.getPlayers()
      if (data.length === 0 && PLAYERS.length > 0) {
        setError('Limite API atteinte — réessai dans 60s.')
      } else {
        setPlayers(data)
        setError(null)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* quota */ }
      }
    } catch {
      setError('Impossible de charger les données des joueurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
    const id = setInterval(fetchPlayers, 60_000)
    return () => clearInterval(id)
  }, [fetchPlayers])

  return { players, loading, error, refetch: fetchPlayers }
}
