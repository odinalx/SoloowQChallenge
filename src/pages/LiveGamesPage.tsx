import { useState } from 'react'
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

function makeDemoGames(): TrackedPlayer[][] {
  const now = Date.now()

  const game1Start = now - 7 * 60 * 1000   // 7 min ago
  const game2Start = now - 22 * 60 * 1000  // 22 min ago

  const game1Participants = [
    { puuid: 'demo-odin',  championId: 222, championName: 'Jinx',       teamId: 100, summonerName: 'Odin',        riotId: '케넨의 신#쥐의 주인' },
    { puuid: 'demo-p2',   championId: 412, championName: 'Thresh',      teamId: 100, summonerName: 'SupportPro',  riotId: 'SupportPro#EUW' },
    { puuid: 'demo-p3',   championId: 104, championName: 'Graves',      teamId: 100, summonerName: 'JungleKing',  riotId: 'JungleKing#1234' },
    { puuid: 'demo-p4',   championId: 103, championName: 'Ahri',        teamId: 100, summonerName: 'MidLaner',    riotId: 'MidLaner#EUW' },
    { puuid: 'demo-p5',   championId: 58,  championName: 'Renekton',    teamId: 100, summonerName: 'TopFighter',  riotId: 'TopFighter#FR' },
    { puuid: 'demo-p6',   championId: 157, championName: 'Yasuo',       teamId: 200, summonerName: 'YasuoMain',   riotId: 'YasuoMain#EUW' },
    { puuid: 'demo-p7',   championId: 99,  championName: 'Lux',         teamId: 200, summonerName: 'LuxPlayer',   riotId: 'LuxPlayer#EUW' },
    { puuid: 'demo-p8',   championId: 54,  championName: 'Malphite',    teamId: 200, summonerName: 'TankMain',    riotId: 'TankMain#EUW' },
    { puuid: 'demo-p9',   championId: 81,  championName: 'Ezreal',      teamId: 200, summonerName: 'EzrealFan',   riotId: 'EzrealFan#1234' },
    { puuid: 'demo-p10',  championId: 16,  championName: 'Soraka',      teamId: 200, summonerName: 'HealsForDays',riotId: 'HealsForDays#EUW' },
  ]

  const game2Participants = [
    { puuid: 'demo-lota',     championId: 64,  championName: 'LeeSin',    teamId: 100, summonerName: 'Lota',        riotId: 'Lota#CHUD' },
    { puuid: 'demo-q2',       championId: 91,  championName: 'Talon',     teamId: 100, summonerName: 'TalonStrike', riotId: 'TalonStrike#EUW' },
    { puuid: 'demo-q3',       championId: 238, championName: 'Zed',       teamId: 100, summonerName: 'ShadowBlade', riotId: 'ShadowBlade#1234' },
    { puuid: 'demo-q4',       championId: 61,  championName: 'Orianna',   teamId: 100, summonerName: 'BallCtrl',    riotId: 'BallCtrl#EUW' },
    { puuid: 'demo-q5',       championId: 40,  championName: 'Janna',     teamId: 100, summonerName: 'WindSupport', riotId: 'WindSupport#FR' },
    { puuid: 'demo-scarroux', championId: 51,  championName: 'Caitlyn',   teamId: 200, summonerName: 'Scarroux',    riotId: 'Scarroux#EUW' },
    { puuid: 'demo-q7',       championId: 53,  championName: 'Blitzcrank',teamId: 200, summonerName: 'GrabMaster',  riotId: 'GrabMaster#EUW' },
    { puuid: 'demo-q8',       championId: 25,  championName: 'Morgana',   teamId: 200, summonerName: 'DarkMage',    riotId: 'DarkMage#1234' },
    { puuid: 'demo-q9',       championId: 55,  championName: 'Katarina',  teamId: 200, summonerName: 'Spin2Win',    riotId: 'Spin2Win#EUW' },
    { puuid: 'demo-q10',      championId: 86,  championName: 'Garen',     teamId: 200, summonerName: 'DemaciaFTW', riotId: 'DemaciaFTW#EUW' },
  ]

  const liveGame1 = { gameId: 9001, gameQueueConfigId: 420, gameMode: 'CLASSIC', gameType: 'MATCHED_GAME', gameLength: 0, gameStartTime: game1Start, participants: game1Participants }
  const liveGame2 = { gameId: 9002, gameQueueConfigId: 420, gameMode: 'CLASSIC', gameType: 'MATCHED_GAME', gameLength: 0, gameStartTime: game2Start, participants: game2Participants }

  return [
    // Game 1 — Odin seul côté bleu
    [
      {
        config: { gameName: '케넨의 신', tagLine: '쥐의 주인', displayName: 'Odin', twitchLogin: '0_0din', color: '#c8aa6e' },
        account: { puuid: 'demo-odin', gameName: '케넨의 신', tagLine: '쥐의 주인' },
        summoner: { puuid: 'demo-odin', profileIconId: 4644, summonerLevel: 500 },
        soloEntry: { queueType: 'RANKED_SOLO_5x5', tier: 'MASTER', rank: 'I', leaguePoints: 200, wins: 120, losses: 98 },
        recentMatches: [],
        isInGame: true,
        liveGame: liveGame1,
      },
    ],
    // Game 2 — Lota côté bleu, Scarroux côté rouge
    [
      {
        config: { gameName: 'Lota', tagLine: 'CHUD', displayName: 'Lota', twitchLogin: 'thelota_', color: '#e05252' },
        account: { puuid: 'demo-lota', gameName: 'Lota', tagLine: 'CHUD' },
        summoner: { puuid: 'demo-lota', profileIconId: 4644, summonerLevel: 400 },
        soloEntry: { queueType: 'RANKED_SOLO_5x5', tier: 'GRANDMASTER', rank: 'I', leaguePoints: 450, wins: 200, losses: 160 },
        recentMatches: [],
        isInGame: true,
        liveGame: liveGame2,
      },
      {
        config: { gameName: 'Scarroux', tagLine: 'EUW', displayName: 'Scarroux', twitchLogin: 'scarroux', color: '#6d28d9' },
        account: { puuid: 'demo-scarroux', gameName: 'Scarroux', tagLine: 'EUW' },
        summoner: { puuid: 'demo-scarroux', profileIconId: 4644, summonerLevel: 350 },
        soloEntry: { queueType: 'RANKED_SOLO_5x5', tier: 'DIAMOND', rank: 'I', leaguePoints: 75, wins: 150, losses: 130 },
        recentMatches: [],
        isInGame: true,
        liveGame: liveGame2,
      },
    ],
  ]
}

export default function LiveGamesPage() {
  const { liveGames, loading, error, refetch } = useLiveGames()
  const [demoGames] = useState(makeDemoGames)
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

      {/* ── Demo section ── */}
      <div className="pt-4 border-t border-lol-border/30">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-lol-gold-light/20">Aperçu démo</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoGames.map(players => (
            <LiveGameView
              key={players[0].liveGame!.gameId}
              trackedPlayers={players}
              demo
            />
          ))}
        </div>
      </div>
    </div>
  )
}
