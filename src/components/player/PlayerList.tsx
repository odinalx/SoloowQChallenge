import { Skeleton } from '@/components/ui/skeleton'
import { PlayerCard } from './PlayerCard'
import type { TrackedPlayer } from '@/types/riot'

interface PlayerListProps {
  players: TrackedPlayer[]
  loading: boolean
}

export function PlayerList({ players, loading }: PlayerListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg bg-lol-card" />
        ))}
      </div>
    )
  }

  if (!players.length) {
    return (
      <p className="text-center text-sm text-lol-gold-light/50">
        Aucun joueur configuré. Modifiez <code className="text-lol-gold">src/constants/players.ts</code>.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {players.map(player => (
        <PlayerCard
          key={`${player.account.gameName}#${player.account.tagLine}`}
          player={player}
        />
      ))}
    </div>
  )
}
