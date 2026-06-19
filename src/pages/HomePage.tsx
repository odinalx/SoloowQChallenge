import { useEffect, useMemo, useRef, useState } from 'react'
import { PlayerTable } from '@/components/player/PlayerTable'
import { LiveStreamPanel } from '@/components/stream/LiveStreamPanel'
import { usePlayerData } from '@/hooks/usePlayerData'
import { computeAbsoluteLP } from '@/constants/ranks'
import type { TrackedPlayer } from '@/types/riot'

const DEFAULT_CHANNEL = '0_0din'

function useActiveLiveChannel(players: TrackedPlayer[]) {
  const [liveLogins, setLiveLogins] = useState<string[]>([])
  // Stable random choice — only re-randomize when the live set changes
  const [activeLogin, setActiveLogin] = useState<string>(DEFAULT_CHANNEL)
  const prevLiveKey = useRef('')

  const twitchPlayers = useMemo(
    () => players.filter(p => p.config.twitchLogin),
    [players]
  )

  useEffect(() => {
    if (!twitchPlayers.length) return

    const check = async () => {
      const results = await Promise.allSettled(
        twitchPlayers.map(async p => {
          const res = await fetch(`/api/twitch/status/${p.config.twitchLogin}`)
          const data = await res.json() as { isLive: boolean }
          return data.isLive ? p.config.twitchLogin! : null
        })
      )
      const live = results.flatMap(r =>
        r.status === 'fulfilled' && r.value ? [r.value] : []
      )
      setLiveLogins(live)
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [twitchPlayers])

  useEffect(() => {
    const key = [...liveLogins].sort().join(',')
    if (key === prevLiveKey.current) return
    prevLiveKey.current = key

    if (liveLogins.length > 0) {
      const pick = liveLogins[Math.floor(Math.random() * liveLogins.length)]
      setActiveLogin(pick)
    } else {
      setActiveLogin(DEFAULT_CHANNEL)
    }
  }, [liveLogins])

  return activeLogin
}

export default function HomePage() {
  const { players, loading, error } = usePlayerData()

  const activeLogin = useActiveLiveChannel(players)

  // Sort by ELO descending to compute each player's rank position
  const rankedPlayers = useMemo(() =>
    [...players].sort((a, b) => {
      const la = a.soloEntry ? computeAbsoluteLP(a.soloEntry.tier, a.soloEntry.rank, a.soloEntry.leaguePoints) : -1
      const lb = b.soloEntry ? computeAbsoluteLP(b.soloEntry.tier, b.soloEntry.rank, b.soloEntry.leaguePoints) : -1
      return lb - la
    }),
    [players]
  )

  const activePlayer = rankedPlayers.find(p => p.config.twitchLogin === activeLogin) ?? null
  const activeRank = activePlayer ? rankedPlayers.indexOf(activePlayer) + 1 : 1

  return (
    <div className="space-y-6">
      {/* Stream section */}
      <LiveStreamPanel login={activeLogin} player={activePlayer} rank={activeRank} />

      {/* Player table */}
      {error && (
        <p className="rounded border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>
      )}
      <PlayerTable players={players} loading={loading} />
    </div>
  )
}
