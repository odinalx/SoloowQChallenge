import { RefreshCw, Gamepad2 } from 'lucide-react'
import { LiveGameView } from '@/components/live/LiveGameView'
import { Skeleton } from '@/components/ui/skeleton'
import { useLiveGames } from '@/hooks/useLiveGames'
import type { TrackedPlayer } from '@/types/riot'

function groupByGame(players: TrackedPlayer[]): Map<number, TrackedPlayer[]> {
  const map = new Map<number, TrackedPlayer[]>()
  for (const p of players) {
    const id = p.liveGame?.gameId ?? 0
    if (!map.has(id)) map.set(id, [])
    map.get(id)!.push(p)
  }
  return map
}

export default function LiveGamesPage() {
  const { liveGames, loading, error, refetch } = useLiveGames()
  const gameGroups = groupByGame(liveGames)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide text-lol-gold">Parties en cours</h1>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 rounded border border-lol-border px-3 py-1.5 text-xs text-lol-gold-light/60 hover:border-lol-gold hover:text-lol-gold transition-colors"
        >
          <RefreshCw size={12} />
          Actualiser
        </button>
      </div>

      {error && (
        <p className="rounded border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg bg-lol-card" />
          ))}
        </div>
      ) : gameGroups.size === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Gamepad2 size={40} className="text-lol-gold-light/20" />
          <p className="text-sm text-lol-gold-light/40">Aucun joueur en partie classée pour le moment.</p>
          <p className="text-xs text-lol-gold-light/30">
            Actualisation automatique toutes les 30 secondes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(gameGroups.values()).map(players => (
            <LiveGameView
              key={players[0].liveGame!.gameId}
              trackedPlayers={players}
            />
          ))}
        </div>
      )}

    </div>
  )
}
