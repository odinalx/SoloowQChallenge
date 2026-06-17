import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MatchBadge } from './MatchBadge'
import { formatRankFR, TIER_FR } from '@/constants/ranks'
import { ddragon, winRate } from '@/lib/utils'
import type { TrackedPlayer } from '@/types/riot'
import { useDDragonVersion } from '@/hooks/useDDragon'
import { Wifi } from 'lucide-react'

interface PlayerCardProps {
  player: TrackedPlayer
}

export function PlayerCard({ player }: PlayerCardProps) {
  const version = useDDragonVersion()
  const { summoner, soloEntry, recentMatches, isInGame, config } = player

  // Last 5 ranked match results for this player
  const last5 = recentMatches.slice(0, 5).map(m => {
    const p = m.info.participants.find(x => x.puuid === player.account.puuid)
    return p ? { win: p.win } : null
  }).filter(Boolean) as { win: boolean }[]

  const tierLabel = soloEntry
    ? formatRankFR(soloEntry.tier, soloEntry.rank, soloEntry.leaguePoints)
    : 'Non classé'

  const tierEmoji = soloEntry ? (TIER_FR[soloEntry.tier] ?? '') : ''

  return (
    <Card className="relative border border-lol-border bg-lol-card transition-colors hover:border-lol-gold">
      {isInGame && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-loss/20 px-2 py-0.5 text-xs text-loss">
          <Wifi size={11} className="animate-pulse" />
          En jeu
        </div>
      )}
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14 border-2 border-lol-border">
            <AvatarImage
              src={ddragon.profileIcon(summoner.profileIconId, version)}
              alt={config.displayName}
            />
            <AvatarFallback className="bg-lol-border text-lol-gold text-lg font-bold">
              {config.displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-lol-navy px-1 text-[9px] text-lol-gold-light/60">
            Nv {summoner.summonerLevel}
          </span>
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-bold text-lol-gold-light">{config.displayName}</span>
            <span className="text-xs text-lol-gold-light/40">#{player.account.tagLine}</span>
          </div>
          <div className="mt-0.5 text-sm text-lol-gold">{tierLabel}</div>
          {soloEntry && (
            <div className="mt-0.5 text-xs text-lol-gold-light/50">
              {soloEntry.wins}V {soloEntry.losses}D —{' '}
              <span className="text-lol-gold-light/70">
                {winRate(soloEntry.wins, soloEntry.losses)}
              </span>
            </div>
          )}
        </div>

        {/* Last 5 matches */}
        {last5.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-lol-gold-light/40">Récents</span>
            <div className="flex gap-1">
              {last5.map((m, i) => (
                <MatchBadge key={i} win={m.win} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
