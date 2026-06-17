import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration, ddragon } from '@/lib/utils'
import type { TrackedPlayer } from '@/types/riot'
import { useDDragonVersion } from '@/hooks/useDDragon'
import { Clock, Swords } from 'lucide-react'

const GAME_MODE_FR: Record<string, string> = {
  CLASSIC: 'Partie classée',
  ARAM: 'ARAM',
  URF: 'URF',
  ONEFORALL: 'Un pour tous',
  CHERRY: 'Arène',
}

interface LiveGameCardProps {
  player: TrackedPlayer
}

export function LiveGameCard({ player }: LiveGameCardProps) {
  const version = useDDragonVersion()
  const { liveGame, config, account } = player
  const [elapsed, setElapsed] = useState(liveGame?.gameLength ?? 0)

  useEffect(() => {
    if (!liveGame) return
    const base = liveGame.gameLength
    const id = setInterval(() => {
      setElapsed(base + Math.floor((Date.now() - liveGame.gameStartTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [liveGame])

  if (!liveGame) return null

  // Find the player's participant entry
  const self = liveGame.participants.find(p => p.puuid === account.puuid)
  const myTeam = self?.teamId ?? 100
  const enemies = liveGame.participants.filter(p => p.teamId !== myTeam)
  const allies = liveGame.participants.filter(p => p.teamId === myTeam && p.puuid !== account.puuid)

  const modeLabel = GAME_MODE_FR[liveGame.gameMode] ?? liveGame.gameMode

  return (
    <Card className="border border-lol-border bg-lol-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-lol-gold-light">{config.displayName}</CardTitle>
          <Badge variant="outline" className="border-lol-border text-lol-gold text-xs">
            {modeLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-lol-gold-light/50">
          <Clock size={12} />
          <span>{formatDuration(elapsed)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* My champion */}
        {self?.championName && (
          <div className="flex items-center gap-3">
            <img
              src={ddragon.championIcon(self.championName, version)}
              alt={self.championName}
              className="h-12 w-12 rounded border border-lol-gold"
            />
            <div>
              <p className="text-sm font-semibold text-lol-gold">{self.championName}</p>
              <p className="text-xs text-lol-gold-light/50">Votre champion</p>
            </div>
          </div>
        )}

        {/* Enemies */}
        {enemies.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-loss/80">
              <Swords size={11} />
              <span>Ennemis</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {enemies.map((p, i) => (
                <div key={i} className="group relative">
                  {p.championName ? (
                    <img
                      src={ddragon.championIcon(p.championName, version)}
                      alt={p.championName}
                      title={p.summonerName}
                      className="h-8 w-8 rounded border border-lol-border transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded border border-lol-border bg-lol-border text-xs text-lol-gold-light/40">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allies */}
        {allies.length > 0 && (
          <div>
            <div className="mb-1 text-xs text-win/80">Alliés</div>
            <div className="flex flex-wrap gap-1">
              {allies.map((p, i) => (
                <div key={i} className="group relative">
                  {p.championName ? (
                    <img
                      src={ddragon.championIcon(p.championName, version)}
                      alt={p.championName}
                      title={p.summonerName}
                      className="h-8 w-8 rounded border border-lol-border transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded border border-lol-border bg-lol-border text-xs text-lol-gold-light/40">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
