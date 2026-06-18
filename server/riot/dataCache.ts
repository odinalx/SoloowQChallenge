interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class DataCache {
  private store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry || Date.now() > entry.expiresAt) return null
    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    return Boolean(entry && Date.now() <= entry.expiresAt)
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  delete(key: string): void {
    this.store.delete(key)
  }
}

export const cache = new DataCache()

export const TTL = {
  ACCOUNT: 60 * 60 * 1000,      // 1 hour
  SUMMONER: 60 * 60 * 1000,     // 1 hour
  LEAGUE: 5 * 60 * 1000,        // 5 min
  LIVE_GAME: 30 * 1000,          // 30 sec
  MATCH: 24 * 60 * 60 * 1000,   // 24 hours
  MATCH_IDS: 5 * 60 * 1000,     // 5 min
  CHAMPION_MAP: 24 * 60 * 60 * 1000, // 24 hours
}
