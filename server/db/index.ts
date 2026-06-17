import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Match } from '../../src/types/riot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.resolve(__dirname, '../../matches.db')

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    key      TEXT PRIMARY KEY,
    puuid    TEXT NOT NULL,
    game_name TEXT NOT NULL,
    tag_line  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS summoners (
    puuid           TEXT PRIMARY KEY,
    profile_icon_id INTEGER NOT NULL,
    summoner_level  INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS league_entries (
    puuid          TEXT NOT NULL,
    queue_type     TEXT NOT NULL,
    tier           TEXT NOT NULL,
    rank           TEXT NOT NULL,
    league_points  INTEGER NOT NULL,
    wins           INTEGER NOT NULL,
    losses         INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (puuid, queue_type)
  );
  CREATE TABLE IF NOT EXISTS matches (
    match_id TEXT PRIMARY KEY,
    data     TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS player_match_ids (
    puuid    TEXT    NOT NULL,
    match_id TEXT    NOT NULL,
    queue_id INTEGER NOT NULL DEFAULT 420,
    PRIMARY KEY (puuid, match_id)
  );
  CREATE INDEX IF NOT EXISTS idx_player_match_ids_puuid ON player_match_ids(puuid, queue_id);
`)

// ─── Accounts ────────────────────────────────────────────────────────────────

export function getAccount(key: string) {
  return db.prepare(
    'SELECT puuid, game_name as gameName, tag_line as tagLine FROM accounts WHERE key = ?'
  ).get(key) as { puuid: string; gameName: string; tagLine: string } | undefined
}

export function saveAccount(key: string, account: { puuid: string; gameName: string; tagLine: string }) {
  db.prepare(
    'INSERT OR REPLACE INTO accounts (key, puuid, game_name, tag_line) VALUES (?, ?, ?, ?)'
  ).run(key, account.puuid, account.gameName, account.tagLine)
}

// ─── Summoners ───────────────────────────────────────────────────────────────

export function getSummoner(puuid: string) {
  return db.prepare(
    'SELECT puuid, profile_icon_id as profileIconId, summoner_level as summonerLevel FROM summoners WHERE puuid = ?'
  ).get(puuid) as { puuid: string; profileIconId: number; summonerLevel: number } | undefined
}

export function saveSummoner(s: { puuid: string; profileIconId: number; summonerLevel: number }) {
  db.prepare(
    'INSERT OR REPLACE INTO summoners (puuid, profile_icon_id, summoner_level) VALUES (?, ?, ?)'
  ).run(s.puuid, s.profileIconId, s.summonerLevel)
}

// ─── League entries ──────────────────────────────────────────────────────────

export function getLeagueEntries(puuid: string) {
  return db.prepare(
    `SELECT queue_type as queueType, tier, rank, league_points as leaguePoints,
            wins, losses, updated_at as updatedAt
     FROM league_entries WHERE puuid = ?`
  ).all(puuid) as Array<{
    queueType: string; tier: string; rank: string;
    leaguePoints: number; wins: number; losses: number; updatedAt: number
  }>
}

export function saveLeagueEntries(
  puuid: string,
  entries: Array<{ queueType: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number }>
) {
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO league_entries
       (puuid, queue_type, tier, rank, league_points, wins, losses, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`
  )
  db.transaction(() => {
    for (const e of entries) stmt.run(puuid, e.queueType, e.tier, e.rank, e.leaguePoints, e.wins, e.losses)
  })()
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export function hasMatch(matchId: string): boolean {
  return !!db.prepare('SELECT 1 FROM matches WHERE match_id = ?').get(matchId)
}

export function getMatch(matchId: string): Match | null {
  const row = db.prepare('SELECT data FROM matches WHERE match_id = ?').get(matchId) as { data: string } | undefined
  return row ? (JSON.parse(row.data) as Match) : null
}

export function saveMatch(matchId: string, match: Match): void {
  db.prepare('INSERT OR IGNORE INTO matches (match_id, data) VALUES (?, ?)').run(matchId, JSON.stringify(match))
}

export function getPlayerMatchIds(puuid: string, queueId = 420): string[] {
  // Sort by numeric suffix of match ID (e.g. EUW1_7302408716) DESC → newest first
  const rows = db.prepare(
    `SELECT match_id FROM player_match_ids WHERE puuid = ? AND queue_id = ?
     ORDER BY CAST(SUBSTR(match_id, INSTR(match_id, '_') + 1) AS INTEGER) DESC`
  ).all(puuid, queueId) as { match_id: string }[]
  return rows.map(r => r.match_id)
}

export function savePlayerMatchIds(puuid: string, matchIds: string[], queueId = 420): void {
  if (!matchIds.length) return
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO player_match_ids (puuid, match_id, queue_id) VALUES (?, ?, ?)'
  )
  db.transaction(() => { for (const id of matchIds) stmt.run(puuid, id, queueId) })()
}
