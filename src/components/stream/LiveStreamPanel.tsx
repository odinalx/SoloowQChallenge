import { useState, useEffect } from 'react'
import { ddragon, winRate } from '@/lib/utils'
import { TIER_FR } from '@/constants/ranks'
import { useDDragonVersion } from '@/hooks/useDDragon'
import type { TrackedPlayer } from '@/types/riot'

function LiveTimer({ startTime, gameLength }: { startTime: number; gameLength: number }) {
  const getElapsed = () =>
    startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : gameLength
  const [elapsed, setElapsed] = useState(getElapsed)
  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsed()), 1000)
    return () => clearInterval(id)
  }, [startTime, gameLength])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return (
    <div className="flex items-center gap-2 text-sm text-lol-gold-light/50 mt-2">
      <span className="h-2 w-2 rounded-full bg-loss animate-pulse flex-shrink-0" />
      <span className="font-mono">{m}:{s.toString().padStart(2, '0')}</span>
      <span className="text-xs uppercase tracking-widest">en jeu</span>
    </div>
  )
}

function StreakSquare({ win, champion, version }: { win: boolean; champion: string; version: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="flex flex-col h-[34px] w-8 flex-shrink-0 rounded-sm overflow-hidden">
      {!err ? (
        <img src={ddragon.championIcon(champion, version)} alt={champion} className={`min-h-0 flex-1 w-full object-cover ${win ? '' : 'grayscale'}`} onError={() => setErr(true)} />
      ) : (
        <div className={`flex min-h-0 flex-1 w-full items-center justify-center bg-neutral-800 text-[8px] text-neutral-500 ${win ? '' : 'grayscale'}`}>{champion.slice(0, 2)}</div>
      )}
      <div className={`w-full h-[5px] flex-shrink-0 ${win ? 'bg-lol-gold' : 'bg-loss'}`} />
    </div>
  )
}

function PlayerStatsPanel({ player, rank }: { player: TrackedPlayer; rank: number }) {
  const version = useDDragonVersion()
  const { config, soloEntry, recentMatches, account, isInGame, liveGame } = player

  const streak = recentMatches.slice(0, 9).map(m => {
    const p = m.info.participants.find(x => x.puuid === account.puuid)
    return p ? { win: p.win, champion: p.championName } : null
  }).filter(Boolean).reverse() as { win: boolean; champion: string }[]

  const total = soloEntry ? soloEntry.wins + soloEntry.losses : 0
  const wr = soloEntry ? winRate(soloEntry.wins, soloEntry.losses) : '—'
  const isMaster = soloEntry ? ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(soloEntry.tier) : false
  const tierName = soloEntry ? (TIER_FR[soloEntry.tier] ?? soloEntry.tier) : null

  return (
    <div className="flex flex-col justify-center gap-4 px-4 md:px-6 py-4 md:py-2 md:h-full">

      {/* Name + rank number inline */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-lol-gold-light leading-none">
          {config.displayName}
        </h2>
        <span className="text-xl md:text-2xl font-bold text-lol-gold-light/30 leading-none">
          #{rank}
        </span>
      </div>

      {/* Rank icon + tier name + LP */}
      {soloEntry ? (
        <div className="flex items-center gap-3">
          <img
            src={ddragon.rankEmblem(soloEntry.tier)}
            alt={soloEntry.tier}
            className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0 object-contain"
          />
          <div>
            <p className="text-lg font-medium text-lol-gold leading-tight">
              {tierName}{!isMaster && ` ${soloEntry.rank}`}
            </p>
            <p className="text-sm font-normal text-lol-gold-light/40">{soloEntry.leaguePoints} PL</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-lol-gold-light/30">Non classé</p>
      )}

      {/* Stats + streak */}
      <div className="w-fit">
        {soloEntry && (
          <>
            <div className="h-px bg-lol-border/40 mb-3" />
            <div className="flex w-full justify-between gap-4 mb-3">
              {[
                { label: 'Victoires', value: String(soloEntry.wins) },
                { label: 'Défaites',  value: String(soloEntry.losses) },
                { label: 'Matchs',    value: String(total) },
                { label: 'Winrate',   value: wr },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-widest text-lol-gold-light/40 mb-0.5">{label}</p>
                  <p className="text-lg font-black text-lol-gold-light">{value}</p>
                </div>
              ))}
            </div>
            <div className="h-px bg-lol-border/40 mb-3" />
          </>
        )}

        {streak.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {streak.map((s, i) => (
              <StreakSquare key={i} win={s.win} champion={s.champion} version={version} />
            ))}
          </div>
        )}
      </div>

      {isInGame && liveGame && (
        <LiveTimer startTime={liveGame.gameStartTime} gameLength={liveGame.gameLength} />
      )}
    </div>
  )
}

interface LiveStreamPanelProps {
  login: string
  player: TrackedPlayer | null
  rank: number
}

export function LiveStreamPanel({ login, player, rank }: LiveStreamPanelProps) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

  return (
    <div className="flex flex-col md:flex-row gap-0">
      {/* Stream — full width on mobile, 65% on desktop */}
      <div className="w-full md:w-[65%] flex-shrink-0">
        <div className="aspect-video w-full">
          <iframe
            src={`https://player.twitch.tv/?channel=${login}&parent=${hostname}&autoplay=false`}
            className="h-full w-full"
            allowFullScreen
            title={`Stream de ${login}`}
          />
        </div>
      </div>

      {/* Stats — full width on mobile, 35% on desktop */}
      <div className="w-full md:flex-1 border-t border-lol-border/30 md:border-t-0">
        {player
          ? <PlayerStatsPanel player={player} rank={rank} />
          : (
            <div className="flex h-full items-center px-4 md:px-6 py-4">
              <p className="text-sm text-lol-gold-light/30">{login}</p>
            </div>
          )}
      </div>
    </div>
  )
}
