import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { TrackedPlayer } from '@/types/riot'

export function useLiveGames() {
  const [liveGames, setLiveGames] = useState<TrackedPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLive = useCallback(async () => {
    try {
      const data = await api.getLiveGames()
      setLiveGames(data)
      setError(null)
    } catch {
      setError('Impossible de charger les parties en cours.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLive()
    const id = setInterval(fetchLive, 30_000)
    return () => clearInterval(id)
  }, [fetchLive])

  return { liveGames, loading, error, refetch: fetchLive }
}
