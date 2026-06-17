import { useState } from 'react'
import { LPGraph } from '@/components/stats/LPGraph'
import { StatLeaderboard } from '@/components/stats/StatLeaderboard'
import { Skeleton } from '@/components/ui/skeleton'
import { useStats } from '@/hooks/useStats'
import { useDDragonVersion } from '@/hooks/useDDragon'
import { ddragon } from '@/lib/utils'
import { PLAYERS } from '@/constants/players'
import type { LeaderboardEntry } from '@/types/riot'

function KDACard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const version = useDDragonVersion()
  const twitchSrc = entry.twitchLogin ? `https://unavatar.io/twitch/${entry.twitchLogin}` : null
  const ddSrc = entry.profileIconId ? ddragon.profileIcon(entry.profileIconId, version) : null
  const [src, setSrc] = useState<string | null>(twitchSrc ?? ddSrc)

  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-5 flex-shrink-0 text-lg font-black text-lol-gold-light/30">{rank}</span>
      <div className="relative flex-shrink-0">
        {src ? (
          <img
            src={src}
            alt={entry.displayName}
            className="h-14 w-14 rounded-full object-cover"
            onError={() => {
              if (src === twitchSrc && ddSrc) setSrc(ddSrc)
              else setSrc(null)
            }}
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-lol-border" />
        )}
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-lol-navy border border-lol-border text-[10px] font-black text-lol-gold-light/60">
          {rank}
        </span>
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight text-lol-gold leading-none">{entry.value}</p>
        <p className="mt-0.5 text-sm font-semibold text-lol-gold-light">{entry.displayName}</p>
        {entry.subLabel && (
          <p className="text-[11px] text-lol-gold-light/40">{entry.subLabel}</p>
        )}
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const { lpHistory, leaderboards, loading, error } = useStats()
  const version = useDDragonVersion()

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-bold tracking-wide text-lol-gold">Statistiques</h1>

      {error && (
        <p className="rounded border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>
      )}

      {/* LP Graph */}
      <section className="rounded-lg border border-lol-border bg-lol-card p-4">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-lol-gold-light/50">
          Progression LP
        </h2>
        {loading ? (
          <Skeleton className="h-80 w-full bg-lol-border/30" />
        ) : (
          <LPGraph history={lpHistory} players={PLAYERS} />
        )}
      </section>

      {/* KDA top row */}
      <section>
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-lol-gold">KDA</p>
        {loading ? (
          <div className="flex gap-10">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-48 bg-lol-border/30 rounded" />
            ))}
          </div>
        ) : leaderboards ? (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-10 gap-y-2 border-b border-lol-border/30 pb-6">
            {leaderboards.kda.map((entry, i) => (
              <KDACard key={entry.puuid} entry={entry} rank={i + 1} />
            ))}
          </div>
        ) : null}
      </section>

      {/* LE TOP — 4 columns */}
      <section>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-lol-gold-light/40">Le Top</p>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full bg-lol-border/30 rounded" />
            ))}
          </div>
        ) : leaderboards ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatLeaderboard title="Kills" entries={leaderboards.kills} version={version} />
            <StatLeaderboard title="Deaths" entries={leaderboards.deaths} version={version} />
            <StatLeaderboard title="Assists" entries={leaderboards.assists} version={version} />
            <StatLeaderboard title="CS / Min" entries={leaderboards.csPerMin} version={version} />
          </div>
        ) : (
          <p className="text-sm text-lol-gold-light/40">Aucune donnée disponible.</p>
        )}
      </section>
    </div>
  )
}
