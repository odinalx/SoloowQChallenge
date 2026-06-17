import { useState } from 'react'
import { ddragon } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/riot'

function LeaderboardAvatar({
  entry,
  version,
  size = 'sm',
}: {
  entry: LeaderboardEntry
  version: string
  size?: 'sm' | 'lg'
}) {
  const twitchSrc = entry.twitchLogin ? `https://unavatar.io/twitch/${entry.twitchLogin}` : null
  const ddSrc = entry.profileIconId ? ddragon.profileIcon(entry.profileIconId, version) : null
  const [src, setSrc] = useState<string | null>(twitchSrc ?? ddSrc)

  const cls = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8'

  if (!src) {
    return <div className={`${cls} rounded-full bg-lol-border flex-shrink-0`} />
  }
  return (
    <img
      src={src}
      alt={entry.displayName}
      className={`${cls} rounded-full object-cover flex-shrink-0`}
      onError={() => {
        if (src === twitchSrc && ddSrc) setSrc(ddSrc)
        else setSrc(null)
      }}
    />
  )
}

interface StatLeaderboardProps {
  title: string
  entries: LeaderboardEntry[]
  version: string
}

export function StatLeaderboard({ title, entries, version }: StatLeaderboardProps) {
  const [first, ...rest] = entries

  return (
    <div>
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-lol-gold">{title}</p>

      {first && (
        <div className="mb-5 flex flex-col items-center gap-1 border-b border-lol-border/30 pb-5">
          <div className="relative">
            <LeaderboardAvatar entry={first} version={version} size="lg" />
            <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-lol-gold text-[10px] font-black text-lol-navy">
              1
            </span>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-lol-gold leading-none">{first.value}</p>
          {first.subLabel && (
            <p className="text-[11px] text-lol-gold-light/40">{first.subLabel}</p>
          )}
          <p className="mt-1 text-sm font-semibold text-lol-gold-light">{first.displayName}</p>
        </div>
      )}

      <div className="space-y-0">
        {rest.map((entry, i) => (
          <div key={entry.puuid} className="flex items-center gap-3 border-b border-lol-border/20 py-3">
            <span className="w-4 flex-shrink-0 text-xs text-lol-gold-light/30">{i + 2}</span>
            <LeaderboardAvatar entry={entry} version={version} size="sm" />
            <span className="flex-1 text-sm text-lol-gold-light">{entry.displayName}</span>
            <span className="font-mono text-sm font-bold text-lol-gold">{entry.value}</span>
            {entry.subLabel && (
              <span className="ml-1 text-[11px] text-lol-gold-light/30">{entry.subLabel}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
