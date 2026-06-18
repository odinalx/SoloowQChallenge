import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTwitchStatus } from '@/hooks/useTwitchStatus'
import { useDDragonVersion } from '@/hooks/useDDragon'
import { cn, ddragon, winRate } from '@/lib/utils'
import { TIER_FR, computeAbsoluteLP } from '@/constants/ranks'
import type { TrackedPlayer } from '@/types/riot'

// ─── Twitch badge ────────────────────────────────────────────────────────────

function TwitchBadge({ login }: { login: string }) {
  const isLive = useTwitchStatus(login)
  return (
    <a
      href={`https://www.twitch.tv/${login}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-200 hover:opacity-80 ${
        isLive ? 'bg-red-600 text-white glow-live' : 'bg-neutral-800 text-neutral-500'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-neutral-600'}`} />
      {isLive ? 'LIVE' : 'OFFLINE'}
    </a>
  )
}

// ─── Streak square ────────────────────────────────────────────────────────────

function StreakSquare({ win, champion, version }: { win: boolean; champion: string; version: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="flex flex-col h-[34px] w-[32px] flex-shrink-0 rounded-sm overflow-hidden">
      {!err ? (
        <img
          src={ddragon.championIcon(champion, version)}
          alt={champion}
          title={champion}
          className={`min-h-0 flex-1 w-full object-cover ${win ? '' : 'grayscale'}`}
          onError={() => setErr(true)}
        />
      ) : (
        <div className={`flex min-h-0 flex-1 w-full items-center justify-center bg-neutral-800 text-[8px] text-neutral-500 ${win ? '' : 'grayscale'}`}>
          {champion.slice(0, 2)}
        </div>
      )}
      <div className={`w-full h-[5px] flex-shrink-0 ${win ? 'bg-lol-gold' : 'bg-loss'}`} />
    </div>
  )
}

// ─── Player avatar ───────────────────────────────────────────────────────────

function PlayerAvatar({ player, version }: { player: TrackedPlayer; version: string }) {
  const twitchLogin = player.config.twitchLogin
  const fallbackSrc = ddragon.profileIcon(player.summoner.profileIconId, version)
  const [src, setSrc] = useState(
    twitchLogin ? `https://unavatar.io/twitch/${twitchLogin}` : fallbackSrc
  )
  // Sync when twitchLogin prop changes (e.g. stale localStorage → fresh fetch)
  const [lastLogin, setLastLogin] = useState(twitchLogin)
  if (twitchLogin !== lastLogin) {
    setLastLogin(twitchLogin)
    setSrc(twitchLogin ? `https://unavatar.io/twitch/${twitchLogin}` : fallbackSrc)
  }
  const color = player.config.color ?? '#c8aa6e'
  return (
    <div className="relative flex-shrink-0">
      <img
        src={src}
        alt={player.config.displayName}
        onError={() => setSrc(fallbackSrc)}
        className="h-10 w-10 rounded-full border-2 object-cover transition-all duration-300"
        style={{
          borderColor: color,
          boxShadow: `0 0 8px ${color}55, 0 0 20px ${color}22`,
        }}
      />
      {player.isInGame && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-lol-navy bg-loss" />
      )}
    </div>
  )
}

// ─── Role icon ───────────────────────────────────────────────────────────────

const ROLE_URL: Record<string, string> = {
  TOP:     'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
  JUNGLE:  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
  MIDDLE:  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
  BOTTOM:  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
  UTILITY: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
}

function RoleIcon({ position }: { position: string | null }) {
  if (!position || !ROLE_URL[position]) return <span className="text-xs text-lol-gold-light/20">—</span>
  return <img src={ROLE_URL[position]} alt={position} title={position} className="h-6 w-6 object-contain opacity-80" />
}

// ─── Rank inline (icon + text on one line) ───────────────────────────────────

function RankInline({ tier, rank, lp }: { tier: string; rank: string; lp: number }) {
  const [err, setErr] = useState(false)
  const tierName = TIER_FR[tier] ?? tier
  const isMaster = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)
  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      {!err && (
        <img
          src={ddragon.rankEmblem(tier)}
          alt={tier}
          className="h-8 w-8 flex-shrink-0 object-contain"
          onError={() => setErr(true)}
        />
      )}
      <span className="text-sm font-semibold text-lol-gold">
        {tierName}{!isMaster && ` ${rank}`}
        <span className="ml-1.5 text-xs font-normal text-lol-gold-light/60">{lp} PL</span>
      </span>
    </div>
  )
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function PlayerMobileCard({ player, rank }: { player: TrackedPlayer; rank: number }) {
  const version = useDDragonVersion()
  const { account, soloEntry, recentMatches, config } = player

  const total = soloEntry ? soloEntry.wins + soloEntry.losses : 0
  const wr = soloEntry ? winRate(soloEntry.wins, soloEntry.losses) : '—'
  const isMaster = soloEntry ? ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(soloEntry.tier) : false
  const tierName = soloEntry ? (TIER_FR[soloEntry.tier] ?? soloEntry.tier) : null

  const streak = recentMatches.slice(0, 10)
    .map(m => {
      const p = m.info.participants.find(x => x.puuid === account.puuid)
      return p ? { win: p.win, champion: p.championName } : null
    })
    .filter(Boolean)
    .reverse() as { win: boolean; champion: string }[]

  const roleCounts = recentMatches.reduce((acc, m) => {
    const pos = m.info.participants.find(x => x.puuid === account.puuid)?.teamPosition
    if (pos) acc[pos] = (acc[pos] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
  const mostPlayedRole = sortedRoles[0]?.[0] ?? null
  const secondRole = sortedRoles[1]?.[0] ?? null

  const wrNum = soloEntry ? Math.round((soloEntry.wins / Math.max(1, total)) * 100) : null
  const wrColor = wrNum === null ? 'text-lol-gold-light/50'
    : wrNum >= 60 ? 'text-win' : wrNum < 50 ? 'text-loss' : 'text-lol-gold-light'

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-colors',
      rank === 1 ? 'border-lol-gold/30 bg-lol-card' : 'border-lol-border bg-lol-card'
    )}>
      {/* Row 1: rank + avatar + name + twitch */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'w-4 flex-shrink-0 text-sm font-black',
          rank === 1 ? 'text-lol-gold glow-gold' : 'text-lol-gold-light/30'
        )}>{rank}</span>
        <PlayerAvatar player={player} version={version} />
        <span className="flex-1 font-semibold text-lol-gold-light">{config.displayName}</span>
        {config.twitchLogin && <TwitchBadge login={config.twitchLogin} />}
      </div>

      {/* Row 2: role + rank + W/L + WR */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex items-end gap-0.5 flex-shrink-0">
          <RoleIcon position={mostPlayedRole} />
          {secondRole && (
            <>
              <span className="text-[10px] text-lol-gold-light/30 leading-none">/</span>
              <img src={ROLE_URL[secondRole]} alt={secondRole} className="h-3.5 w-3.5 object-contain opacity-40" />
            </>
          )}
          {!secondRole && <div className="h-3.5 w-3.5" />}
        </div>
        {soloEntry ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <img src={ddragon.rankEmblem(soloEntry.tier)} alt={soloEntry.tier} className="h-6 w-6 flex-shrink-0 object-contain" />
            <span className="text-sm font-semibold text-lol-gold truncate">
              {tierName}{!isMaster && ` ${soloEntry.rank}`}
              <span className="ml-1 text-xs font-normal text-lol-gold-light/50">{soloEntry.leaguePoints} PL</span>
            </span>
          </div>
        ) : (
          <span className="flex-1 text-sm text-lol-gold-light/30">Non classé</span>
        )}
        <div className="flex items-center gap-1.5 flex-shrink-0 font-mono text-xs">
          <span className="text-win">{soloEntry?.wins ?? '—'}</span>
          <span className="text-lol-gold-light/20">/</span>
          <span className="text-loss">{soloEntry?.losses ?? '—'}</span>
          <span className={`ml-1 font-semibold ${wrColor}`}>{wr}</span>
        </div>
      </div>

      {/* Row 3: DPM link */}
      <div className="mb-2.5">
        <a
          href={`https://dpm.lol/${encodeURIComponent(account.gameName)}-${encodeURIComponent(account.tagLine)}`}
          target="_blank" rel="noopener noreferrer"
          className="font-mono text-xs text-lol-gold-light/40 hover:text-lol-gold transition-colors"
        >
          {account.gameName}<span className="text-lol-gold-light/20">#{account.tagLine}</span>
        </a>
      </div>

      {/* Row 4: streak */}
      {streak.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {streak.map((s, i) => (
            <StreakSquare key={i} win={s.win} champion={s.champion} version={version} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sort key helpers ─────────────────────────────────────────────────────────

type SortKey = 'name' | 'elo' | 'matches' | 'wins' | 'losses' | 'wr'

function getSortValue(p: TrackedPlayer, key: SortKey): number | string {
  const sr = p.soloEntry
  switch (key) {
    case 'name': return p.config.displayName.toLowerCase()
    case 'elo':  return sr ? computeAbsoluteLP(sr.tier, sr.rank, sr.leaguePoints) : -1
    case 'matches': return sr ? sr.wins + sr.losses : -1
    case 'wins':    return sr?.wins ?? -1
    case 'losses':  return sr?.losses ?? -1
    case 'wr':      return sr ? sr.wins / Math.max(1, sr.wins + sr.losses) : -1
  }
}

// ─── Sortable column header ───────────────────────────────────────────────────

function TH({
  children, sortKey, activeKey, dir, onSort, center, first,
}: {
  children: React.ReactNode
  sortKey?: SortKey
  activeKey: SortKey | null
  dir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
  center?: boolean
  first?: boolean
}) {
  const active = sortKey && activeKey === sortKey
  return (
    <th
      onClick={() => sortKey && onSort(sortKey)}
      className={[
        'border-b border-lol-border/80 bg-lol-card/80 py-2.5 text-[11px] font-semibold uppercase tracking-widest',
        center ? 'text-center' : 'text-left',
        first ? 'pl-4' : 'px-3',
        sortKey ? 'cursor-pointer select-none hover:text-lol-gold transition-colors' : '',
        active ? 'text-lol-gold' : 'text-lol-gold-light/40',
      ].join(' ')}
    >
      <div className={`inline-flex items-center gap-1 ${center ? 'justify-center' : ''}`}>
        {children}
        {sortKey && (
          active
            ? dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
            : <ChevronsUpDown size={11} className="opacity-30" />
        )}
      </div>
    </th>
  )
}

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({ player, rank }: { player: TrackedPlayer; rank: number }) {
  const version = useDDragonVersion()
  const { account, soloEntry, recentMatches, config } = player

  const total = soloEntry ? soloEntry.wins + soloEntry.losses : 0
  const wr = soloEntry ? winRate(soloEntry.wins, soloEntry.losses) : '—'

  // Most recent match = recentMatches[0] → should be on the RIGHT → reverse
  const streak = recentMatches.slice(0, 10)
    .map(m => {
      const p = m.info.participants.find(x => x.puuid === account.puuid)
      return p ? { win: p.win, champion: p.championName } : null
    })
    .filter(Boolean)
    .reverse() as { win: boolean; champion: string }[]

  // Most played role from recent matches
  const roleCounts = recentMatches.reduce((acc, m) => {
    const pos = m.info.participants.find(x => x.puuid === account.puuid)?.teamPosition
    if (pos) acc[pos] = (acc[pos] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
  const mostPlayedRole = sortedRoles[0]?.[0] ?? null
  const secondRole = sortedRoles[1]?.[0] ?? null

  const wrNum = soloEntry ? Math.round((soloEntry.wins / Math.max(1, total)) * 100) : null
  const wrColor = wrNum === null ? 'text-lol-gold-light/50'
    : wrNum >= 60 ? 'text-win'
    : wrNum < 50 ? 'text-loss'
    : 'text-lol-gold-light'

  return (
    <tr className={cn(
      'border-b border-white/[0.06] transition-colors',
      rank === 1 ? 'bg-lol-gold/[0.03] hover:bg-lol-gold/[0.06]' : 'hover:bg-white/[0.03]'
    )}>
      <td className={cn(
        'py-5 pl-3 pr-2 text-center text-sm font-black',
        rank === 1 ? 'text-lol-gold glow-gold' : 'text-lol-gold-light/25'
      )}>{rank}</td>

      <td className="py-5 px-3">
        <div className="flex items-center gap-3">
          <PlayerAvatar player={player} version={version} />
          <span className="font-semibold text-lol-gold-light">{config.displayName}</span>
        </div>
      </td>

      <td className="py-5 px-3">
        {config.twitchLogin
          ? <TwitchBadge login={config.twitchLogin} />
          : <span className="text-xs text-lol-gold-light/20">—</span>}
      </td>

      <td className="py-5 px-3">
        <a
          href={`https://dpm.lol/${encodeURIComponent(account.gameName)}-${encodeURIComponent(account.tagLine)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group font-mono text-sm text-lol-gold-light/60 hover:text-lol-gold transition-colors"
        >
          {account.gameName}
          <span className="text-lol-gold-light/25 group-hover:text-lol-gold/40">#{account.tagLine}</span>
        </a>
      </td>

      <td className="py-5 px-3 text-center">
        <div className="inline-flex items-end gap-1">
          <RoleIcon position={mostPlayedRole} />
          <span className={`text-[10px] leading-none ${secondRole ? 'text-lol-gold-light/30' : 'invisible'}`}>/</span>
          {secondRole
            ? <img src={ROLE_URL[secondRole]} alt={secondRole} title={secondRole} className="h-3.5 w-3.5 object-contain opacity-40" />
            : <div className="h-3.5 w-3.5" />}
        </div>
      </td>

      <td className="py-5 px-3">
        {soloEntry
          ? <RankInline tier={soloEntry.tier} rank={soloEntry.rank} lp={soloEntry.leaguePoints} />
          : <span className="text-sm text-lol-gold-light/30">Non classé</span>}
      </td>

      <td className="py-5 px-3 text-center font-mono text-sm text-lol-gold-light/60">{total || '—'}</td>
      <td className="py-5 px-3 text-center font-mono text-sm text-lol-gold-light/60">{soloEntry?.wins ?? '—'}</td>
      <td className="py-5 px-3 text-center font-mono text-sm text-lol-gold-light/60">{soloEntry?.losses ?? '—'}</td>

      <td className={`py-5 px-3 text-center font-mono text-sm font-semibold ${wrColor}`}>{wr}</td>

      <td className="py-5 pl-3 pr-2">
        <div className="flex gap-1">
          {streak.length > 0
            ? streak.map((s, i) => (
                <StreakSquare key={i} win={s.win} champion={s.champion} version={version} />
              ))
            : <span className="text-xs text-lol-gold-light/20">—</span>}
        </div>
      </td>
    </tr>
  )
}

// ─── Main table ───────────────────────────────────────────────────────────────

interface PlayerTableProps {
  players: TrackedPlayer[]
  loading: boolean
}

export function PlayerTable({ players, loading }: PlayerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>('elo')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = sortKey
    ? [...players].sort((a, b) => {
        const va = getSortValue(a, sortKey)
        const vb = getSortValue(b, sortKey)
        const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
        return sortDir === 'desc' ? -cmp : cmp
      })
    : players

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded bg-lol-card" />
        ))}
      </div>
    )
  }

  if (!players.length) {
    return (
      <p className="py-8 text-center text-sm text-lol-gold-light/40">
        Aucun joueur configuré — modifie <code className="text-lol-gold">src/constants/players.ts</code>
      </p>
    )
  }

  const thProps = { activeKey: sortKey, dir: sortDir, onSort: handleSort }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((player, i) => (
          <PlayerMobileCard
            key={`${player.account.gameName}#${player.account.tagLine}`}
            player={player}
            rank={i + 1}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <thead>
            <tr>
              <TH {...thProps} first>#</TH>
              <TH {...thProps}>PLAYER</TH>
              <TH {...thProps}>TWITCH</TH>
              <TH {...thProps}>COMPTE / STATS</TH>
              <TH {...thProps} center>RÔLE</TH>
              <TH {...thProps} sortKey="elo">ELO</TH>
              <TH {...thProps} sortKey="matches" center>M</TH>
              <TH {...thProps} sortKey="wins" center>V</TH>
              <TH {...thProps} sortKey="losses" center>D</TH>
              <TH {...thProps} sortKey="wr" center>WR</TH>
              <TH {...thProps}>STREAK</TH>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <PlayerRow
                key={`${player.account.gameName}#${player.account.tagLine}`}
                player={player}
                rank={i + 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
