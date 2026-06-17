export interface PlayerConfig {
  gameName: string
  tagLine: string
  displayName: string
  twitchLogin?: string
  color?: string
}

export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

export interface Summoner {
  puuid: string
  profileIconId: number
  summonerLevel: number
}

export interface LeagueEntry {
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

export interface LiveGameParticipant {
  puuid: string
  championId: number
  championName?: string
  teamId: number
  summonerName: string
  riotId?: string
}

export interface LiveGame {
  gameId: number
  gameQueueConfigId: number
  gameMode: string
  gameType: string
  gameLength: number
  gameStartTime: number
  participants: LiveGameParticipant[]
}

export interface MatchParticipant {
  puuid: string
  summonerName: string
  riotIdGameName?: string
  championName: string
  teamPosition?: string
  kills: number
  deaths: number
  assists: number
  totalMinionsKilled: number
  neutralMinionsKilled: number
  win: boolean
  teamId: number
}

export interface MatchInfo {
  gameId: number
  queueId?: number
  gameCreation?: number
  gameDuration: number
  gameMode: string
  participants: MatchParticipant[]
}

export interface Match {
  metadata: { matchId: string; participants: string[] }
  info: MatchInfo
}

export interface TrackedPlayer {
  config: PlayerConfig
  account: RiotAccount
  summoner: Summoner
  soloEntry: LeagueEntry | null
  recentMatches: Match[]
  isInGame: boolean
  liveGame?: LiveGame
}

export interface LPSnapshot {
  puuid: string
  gameName: string
  tagLine: string
  absoluteLP: number
  tier: string
  rank: string
  leaguePoints: number
  timestamp: string
}

export interface LeaderboardEntry {
  displayName: string
  value: string
  subLabel?: string
  puuid: string
  twitchLogin?: string
  profileIconId?: number
}

export interface LeaderboardStats {
  kda: LeaderboardEntry[]
  kills: LeaderboardEntry[]
  deaths: LeaderboardEntry[]
  assists: LeaderboardEntry[]
  csPerMin: LeaderboardEntry[]
}
