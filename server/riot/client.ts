const EUROPE = 'https://europe.api.riotgames.com'
const EUW1 = 'https://euw1.api.riotgames.com'

async function riotFetch<T>(baseUrl: string, path: string, attempt = 0): Promise<T> {
  const key = process.env.RIOT_API_KEY
  if (!key) throw new Error('RIOT_API_KEY manquante')
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-Riot-Token': key }
  })
  if (res.status === 404) throw Object.assign(new Error('Not found'), { status: 404 })
  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get('Retry-After') ?? '1') * 1000
    await new Promise(r => setTimeout(r, retryAfter || 1000 * (attempt + 1)))
    return riotFetch<T>(baseUrl, path, attempt + 1)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Riot API ${res.status} ${path}: ${body}`)
  }
  return res.json() as Promise<T>
}

export const riotClient = {
  getAccountByRiotId: (gameName: string, tagLine: string) =>
    riotFetch<{ puuid: string; gameName: string; tagLine: string }>(
      EUROPE,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    ),

  getSummonerByPuuid: (puuid: string) =>
    riotFetch<{ puuid: string; profileIconId: number; summonerLevel: number }>(
      EUW1,
      `/lol/summoner/v4/summoners/by-puuid/${puuid}`
    ),

  getLeagueEntriesByPuuid: (puuid: string) =>
    riotFetch<Array<{ queueType: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number }>>(
      EUW1,
      `/lol/league/v4/entries/by-puuid/${puuid}`
    ),

  getActiveGameByPuuid: (puuid: string) =>
    riotFetch<{
      gameId: number; gameQueueConfigId: number; gameMode: string; gameType: string;
      gameLength: number; gameStartTime: number;
      participants: Array<{ puuid: string; championId: number; teamId: number; summonerName: string; riotId?: string }>
    }>(
      EUW1,
      `/lol/spectator/v5/active-games/by-summoner/${puuid}`
    ),

  getMatchIds: (puuid: string, count = 10, queue?: number, start = 0, startTime?: number) =>
    riotFetch<string[]>(
      EUROPE,
      `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}${queue != null ? `&queue=${queue}` : ''}${startTime != null ? `&startTime=${startTime}` : ''}`
    ),

  getMatch: (matchId: string) =>
    riotFetch<{
      metadata: { matchId: string; participants: string[] }
      info: {
        gameId: number; queueId: number; gameCreation: number; gameDuration: number; gameMode: string;
        participants: Array<{
          puuid: string; summonerName: string; riotIdGameName?: string;
          championName: string; kills: number; deaths: number; assists: number;
          totalMinionsKilled: number; neutralMinionsKilled: number;
          win: boolean; teamId: number
        }>
      }
    }>(
      EUROPE,
      `/lol/match/v5/matches/${matchId}`
    ),

  getChampionData: (version: string) =>
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`)
      .then(r => r.json() as Promise<{ data: Record<string, { key: string; id: string; name: string }> }>),

  getDDragonVersion: () =>
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then(r => r.json() as Promise<string[]>)
      .then(v => v[0]),
}
