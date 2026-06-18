import { useEffect, useState } from 'react'
import { ddragon, formatDuration } from '@/lib/utils'
import { TIER_FR } from '@/constants/ranks'
import { useDDragonVersion } from '@/hooks/useDDragon'
import { useTwitchStatus } from '@/hooks/useTwitchStatus'
import type { TrackedPlayer, LiveGameParticipant, PlayerConfig } from '@/types/riot'

// ─── Timer ────────────────────────────────────────────────────────────────────

function useElapsed(gameStartTime: number, gameLength: number): number {
  const calc = () =>
    gameStartTime > 0 ? Math.floor((Date.now() - gameStartTime) / 1000) : gameLength
  const [elapsed, setElapsed] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setElapsed(calc()), 1000)
    return () => clearInterval(id)
  }, [gameStartTime, gameLength])
  return elapsed
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function participantDpm(p: LiveGameParticipant): string | null {
  const id = p.riotId ?? ''
  if (!id.includes('#')) return null
  const [name, tag] = id.split('#')
  return `https://dpm.lol/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`
}

function configDpm(c: PlayerConfig): string {
  return `https://dpm.lol/${encodeURIComponent(c.gameName)}-${encodeURIComponent(c.tagLine)}`
}

function pName(p: LiveGameParticipant): string {
  return p.riotId ?? p.summonerName
}

// ─── Twitch live badge (red) ──────────────────────────────────────────────────

function TwitchLiveBadge({ login, forceShow }: { login?: string; forceShow?: boolean }) {
  const fromApi = useTwitchStatus(forceShow ? undefined : login)
  const show = forceShow || fromApi
  if (!login || !show) return null
  return (
    <a
      href={`https://www.twitch.tv/${login}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-red-500 transition-colors flex-shrink-0"
    >
      <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
      LIVE
    </a>
  )
}

// ─── Tracked player cell ──────────────────────────────────────────────────────
// Content is pushed toward the inner edge (center divider):
//   Blue: justify-end → [info right-aligned] [icon at inner-right]
//   Red:  justify-start → [icon at inner-left] [info left-aligned]

interface TrackedCellProps {
  participant: LiveGameParticipant
  player: TrackedPlayer
  side: 'blue' | 'red'
  version: string
  forceShowLive?: boolean
  showLiveBadge?: boolean
}

function TrackedCell({ participant, player, side, version, forceShowLive, showLiveBadge = true }: TrackedCellProps) {
  const isBlue = side === 'blue'
  const borderColor = isBlue ? '#0397ab' : '#ef4444'
  const { config, soloEntry } = player
  const isMaster = soloEntry ? ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(soloEntry.tier) : false
  const tierName = soloEntry ? (TIER_FR[soloEntry.tier] ?? soloEntry.tier) : null

  const icon = participant.championName ? (
    <img
      src={ddragon.championIcon(participant.championName, version)}
      alt={participant.championName}
      title={participant.championName}
      className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
      style={{ border: `3px solid ${borderColor}` }}
    />
  ) : (
    <div
      className="flex h-14 w-14 flex-shrink-0 rounded-full items-center justify-center bg-lol-border"
      style={{ border: `3px solid ${borderColor}` }}
    />
  )

  if (isBlue) {
    // Blue: push everything RIGHT toward inner edge → [info] [icon-at-right]
    return (
      <div className="flex items-center justify-end gap-3 px-4 py-4">
        <div className="flex flex-col items-end gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            {showLiveBadge && <TwitchLiveBadge login={config.twitchLogin} forceShow={forceShowLive} />}
            <a href={configDpm(config)} target="_blank" rel="noopener noreferrer"
               className="text-xl font-black uppercase italic tracking-tight text-lol-gold-light hover:text-lol-gold transition-colors leading-none">
              {config.displayName}
            </a>
          </div>
          {soloEntry && (
            <div className="flex items-center gap-1.5">
              <img src={ddragon.rankEmblem(soloEntry.tier)} alt={soloEntry.tier} className="h-6 w-6 object-contain flex-shrink-0" />
              <span className="text-sm font-semibold text-lol-gold-light/80 whitespace-nowrap">
                {isMaster ? tierName : `${tierName} ${soloEntry.rank}`}
                <span className="ml-1 text-xs text-lol-gold-light/40">({soloEntry.leaguePoints} PL)</span>
              </span>
            </div>
          )}
        </div>
        {icon}
      </div>
    )
  }

  // Red: push everything LEFT toward inner edge → [icon-at-left] [info]
  return (
    <div className="flex items-center justify-start gap-3 px-4 py-4">
      {icon}
      <div className="flex flex-col items-start gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <a href={configDpm(config)} target="_blank" rel="noopener noreferrer"
             className="text-xl font-black uppercase italic tracking-tight text-lol-gold-light hover:text-lol-gold transition-colors leading-none">
            {config.displayName}
          </a>
          {showLiveBadge && <TwitchLiveBadge login={config.twitchLogin} forceShow={forceShowLive} />}
        </div>
        {soloEntry && (
          <div className="flex items-center gap-1.5">
            <img src={ddragon.rankEmblem(soloEntry.tier)} alt={soloEntry.tier} className="h-6 w-6 object-contain flex-shrink-0" />
            <span className="text-sm font-semibold text-lol-gold-light/80 whitespace-nowrap">
              {isMaster ? tierName : `${tierName} ${soloEntry.rank}`}
              <span className="ml-1 text-xs text-lol-gold-light/40">({soloEntry.leaguePoints} PL)</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Normal participant rows — icons at inner edge ────────────────────────────
// Blue: justify-end → name … icon-at-right
// Red:  justify-start → icon-at-left … name

function BlueCell({ p, version }: { p: LiveGameParticipant; version: string }) {
  const href = participantDpm(p)
  const name = pName(p)
  return (
    <div className="flex items-center justify-end gap-2.5 px-4 py-2">
      <span className="text-sm min-w-0 text-right">
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-lol-gold-light/65 hover:text-lol-gold transition-colors">{name}</a>
          : <span className="text-lol-gold-light/30 italic">{name}</span>}
      </span>
      {p.championName
        ? <img src={ddragon.championIcon(p.championName, version)} alt={p.championName} className="h-8 w-8 flex-shrink-0 rounded-full border border-[#0397ab]/35 object-cover" />
        : <div className="h-8 w-8 flex-shrink-0 rounded-full border border-[#0397ab]/20 bg-lol-border" />}
    </div>
  )
}

function RedCell({ p, version }: { p: LiveGameParticipant; version: string }) {
  const href = participantDpm(p)
  const name = pName(p)
  return (
    <div className="flex items-center justify-start gap-2.5 px-4 py-2">
      {p.championName
        ? <img src={ddragon.championIcon(p.championName, version)} alt={p.championName} className="h-8 w-8 flex-shrink-0 rounded-full border border-[#ef4444]/35 object-cover" />
        : <div className="h-8 w-8 flex-shrink-0 rounded-full border border-[#ef4444]/20 bg-lol-border" />}
      <span className="text-sm min-w-0">
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-lol-gold-light/65 hover:text-lol-gold transition-colors">{name}</a>
          : <span className="text-lol-gold-light/30 italic">{name}</span>}
      </span>
    </div>
  )
}

// ─── Full game view ───────────────────────────────────────────────────────────

interface LiveGameViewProps {
  trackedPlayers: TrackedPlayer[]
  demo?: boolean
}

export function LiveGameView({ trackedPlayers, demo }: LiveGameViewProps) {
  const version = useDDragonVersion()
  const liveGame = trackedPlayers[0]?.liveGame
  if (!liveGame) return null

  const elapsed = useElapsed(liveGame.gameStartTime, liveGame.gameLength)
  const trackedPuuids = new Set(trackedPlayers.map(tp => tp.account.puuid))

  const blueRaw = liveGame.participants.filter(p => p.teamId === 100)
  const redRaw = liveGame.participants.filter(p => p.teamId === 200)

  // Sort by team slot (1=Top → 5=Support)
  const byRole = (a: LiveGameParticipant, b: LiveGameParticipant) =>
    (a.teamParticipantId ?? 99) - (b.teamParticipantId ?? 99)
  const blueList = [...blueRaw].sort(byRole)
  const redList = [...redRaw].sort(byRole)

  const blueTrackedMap = new Map(
    trackedPlayers
      .filter(tp => blueRaw.some(p => p.puuid === tp.account.puuid))
      .map(tp => [tp.account.puuid, tp])
  )
  const redTrackedMap = new Map(
    trackedPlayers
      .filter(tp => redRaw.some(p => p.puuid === tp.account.puuid))
      .map(tp => [tp.account.puuid, tp])
  )

  // Which column has no tracked player? That's the "enemy only" column.
  // Push it to the bottom so enemies don't visually face the tracked player.
  const singlePlayer = trackedPlayers.length === 1
  const trackedIsBlue = singlePlayer && blueRaw.some(p => trackedPuuids.has(p.puuid))
  const blueJustify = singlePlayer && !trackedIsBlue ? 'justify-end' : 'justify-start'
  const redJustify  = singlePlayer && trackedIsBlue  ? 'justify-end' : 'justify-start'

  const soloStreamer = singlePlayer ? trackedPlayers[0] : null
  const modeLabel = liveGame.gameMode === 'CLASSIC' ? 'Partie Classée' : liveGame.gameMode

  // ─── Mobile layout ──────────────────────────────────────────────────────────
  const MobilePlayerRow = ({ p }: { p: LiveGameParticipant }) => {
    const href = participantDpm(p)
    const name = pName(p)
    return (
      <div className="flex items-center gap-2.5 px-4 py-1.5">
        {p.championName
          ? <img src={ddragon.championIcon(p.championName, version)} alt={p.championName} className="h-7 w-7 flex-shrink-0 rounded-full object-cover border border-lol-border/40" />
          : <div className="h-7 w-7 flex-shrink-0 rounded-full bg-lol-border" />}
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-lol-gold-light/60 hover:text-lol-gold transition-colors">{name}</a>
          : <span className="text-sm text-lol-gold-light/30 italic">{name}</span>}
      </div>
    )
  }

  const MobileTrackedCard = ({ tp, p }: { tp: typeof trackedPlayers[0]; p: LiveGameParticipant }) => {
    const isBlue = p.teamId === 100
    const { config, soloEntry } = tp
    const isMaster = soloEntry ? ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(soloEntry.tier) : false
    const tierName = soloEntry ? (TIER_FR[soloEntry.tier] ?? soloEntry.tier) : null
    const borderColor = isBlue ? '#0397ab' : '#ef4444'
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-lol-border/20 last:border-0">
        {p.championName
          ? <img src={ddragon.championIcon(p.championName, version)} alt={p.championName} className="h-16 w-16 flex-shrink-0 rounded-full object-cover" style={{ border: `3px solid ${borderColor}` }} />
          : <div className="h-16 w-16 flex-shrink-0 rounded-full bg-lol-border" style={{ border: `3px solid ${borderColor}` }} />}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a href={configDpm(config)} target="_blank" rel="noopener noreferrer"
               className="text-xl font-black uppercase italic tracking-tight text-lol-gold-light hover:text-lol-gold transition-colors leading-none">
              {config.displayName}
            </a>
            {!singlePlayer && <TwitchLiveBadge login={config.twitchLogin} forceShow={demo} />}
          </div>
          {soloEntry && (
            <div className="flex items-center gap-1.5">
              <img src={ddragon.rankEmblem(soloEntry.tier)} alt={soloEntry.tier} className="h-5 w-5 object-contain flex-shrink-0" />
              <span className="text-sm font-semibold text-lol-gold-light/80 whitespace-nowrap">
                {isMaster ? tierName : `${tierName} ${soloEntry.rank}`}
                <span className="ml-1 text-xs text-lol-gold-light/40">({soloEntry.leaguePoints} PL)</span>
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-lol-border bg-lol-card overflow-hidden">

      {/* Header: LIVE badge (solo streamer, top-left) + timer (top-right) */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-lol-border/50">
        <div>
          {soloStreamer?.config.twitchLogin
            ? <TwitchLiveBadge login={soloStreamer.config.twitchLogin} forceShow={demo} />
            : <span className="text-[11px] uppercase tracking-widest text-lol-gold-light/20">{modeLabel}</span>}
        </div>
        <span className="font-mono text-sm font-bold text-lol-gold tracking-widest tabular-nums">
          {formatDuration(elapsed)}
        </span>
      </div>

      {/* ── Mobile layout: tracked first → rest → side label ── */}
      <div className="md:hidden divide-y divide-lol-border/30">
        {/* Blue section */}
        <div className="pt-2 pb-1">
          {blueList.map(p => {
            const tp = blueTrackedMap.get(p.puuid)
            return tp
              ? <MobileTrackedCard key={p.puuid} tp={tp} p={p} />
              : <MobilePlayerRow key={p.puuid} p={p} />
          })}
          <p className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-[#0397ab]">Blue Side</p>
        </div>

        {/* Red section */}
        <div className="pt-2 pb-1">
          {redList.map(p => {
            const tp = redTrackedMap.get(p.puuid)
            return tp
              ? <MobileTrackedCard key={p.puuid} tp={tp} p={p} />
              : <MobilePlayerRow key={p.puuid} p={p} />
          })}
          <p className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-[#ef4444]">Red Side</p>
        </div>
      </div>

      {/* ── Desktop layout: two columns ── */}
      <div className="hidden md:flex divide-x divide-lol-border/30">

        {/* Blue column — enemy-only columns use justify-end (anchored to bottom) */}
        <div className={`flex-1 flex flex-col ${blueJustify}`}>
          {blueList.map((p, i) => {
            const tp = blueTrackedMap.get(p.puuid)
            return tp
              ? <TrackedCell key={p.puuid} participant={p} player={tp} side="blue" version={version} forceShowLive={demo} showLiveBadge={!singlePlayer} />
              : <BlueCell key={i} p={p} version={version} />
          })}
        </div>

        {/* Red column */}
        <div className={`flex-1 flex flex-col ${redJustify}`}>
          {redList.map((p, i) => {
            const tp = redTrackedMap.get(p.puuid)
            return tp
              ? <TrackedCell key={p.puuid} participant={p} player={tp} side="red" version={version} forceShowLive={demo} showLiveBadge={!singlePlayer} />
              : <RedCell key={i} p={p} version={version} />
          })}
        </div>
      </div>

      {/* Side labels (desktop only) */}
      <div className="hidden md:flex border-t border-lol-border/40">
        <div className="flex-1 py-2 px-4 text-[11px] font-bold uppercase tracking-widest text-[#0397ab]">Blue Side</div>
        <div className="flex-1 py-2 px-4 text-right text-[11px] font-bold uppercase tracking-widest text-[#ef4444]">Red Side</div>
      </div>
    </div>
  )
}
