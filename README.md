# SolowQ Challenge

A real-time leaderboard and stats tracker for a group of friends competing in League of Legends Solo Queue. Tracks ranked progress, live games, recent match streaks, and Twitch stream status — all from the Riot Games API.

## Features

- **Live leaderboard** — sortable table by ELO, winrate, wins, losses, or total games
- **Live game detection** — detects when a tracked player is in a ranked game with an in-game timer
- **Match streak** — last 9 ranked games shown as champion icons with win/loss color bars
- **LP progression graph** — line chart of absolute LP over time for all players (snapshots every 90 min, kept for 1 year)
- **Stats leaderboards** — rankings by KDA, kills, deaths, assists, and CS/min across all tracked matches
- **Twitch integration** — LIVE badge on players who are streaming, stream embed auto-switches to whoever is live
- **Responsive** — dedicated mobile card layout and desktop table view
- **Auto-sync** — cron job syncs match data every 15 min; LP snapshots every 90 min using a sliding-window rate limiter

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Node.js, Express, better-sqlite3 |
| Data | Riot Games API (EUW), Twitch Helix API |
| Deployment | Docker (multi-stage), docker-compose |

## Prerequisites

- Node.js 22+
- A [Riot Games API key](https://developer.riotgames.com) (personal key for dev, production key for permanent deploys)
- *(Optional)* Twitch app credentials for live status and profile pictures

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys (see [Environment variables](#environment-variables) below).

### 3. Add your players

Edit `src/constants/players.ts`:

```ts
export const PLAYERS: PlayerConfig[] = [
  {
    gameName: 'YourName',   // Riot ID game name
    tagLine: 'EUW',         // Riot ID tag (without the #)
    displayName: 'You',     // Label shown in the UI
    twitchLogin: 'yourchannel', // Optional — enables LIVE badge + stream embed
    color: '#c8aa6e',       // Accent color for avatar ring
  },
  // add more players...
]
```

### 4. Run in development

```bash
npm run dev
```

This starts the Express API on `:3001` and the Vite dev server on `:5173` concurrently. The cron job fires immediately on startup and begins populating the SQLite database — the leaderboard will show data within the first sync cycle (~30 seconds).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `RIOT_API_KEY` | Yes | Riot Games API key |
| `PORT` | No | API server port (default: `3001`) |
| `TWITCH_CHANNEL` | No | Default stream channel shown when no tracked player is live |
| `TWITCH_CLIENT_ID` | No | Twitch app client ID — enables LIVE badges and profile pictures |
| `TWITCH_CLIENT_SECRET` | No | Twitch app client secret |
| `DB_PATH` | No | SQLite database path (default: `./matches.db`) |
| `LP_FILE` | No | LP history JSON path (default: `./lp_history.json`) |

## Production deployment

### Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

The `docker-compose.yml` mounts a `./data` volume for persistent storage of the database and LP history. Make sure `.env` is populated before starting.

### Manual build

```bash
# Build frontend
npm run build

# Compile server
npx tsc -p tsconfig.server.json

# Start
NODE_ENV=production node dist-server/index.js
```

In production the server serves the React build from `dist/` and exposes a single port (`3001` by default).

## Project structure

```
src/
  constants/players.ts   # ← tracked players config (edit this)
  components/
    layout/              # Navbar, Layout
    player/              # PlayerTable (desktop + mobile), PlayerCard
    live/                # LiveGameCard, LiveGameView
    stats/               # LPGraph, StatLeaderboard
    stream/              # LiveStreamPanel (Twitch embed + player stats)
  pages/
    HomePage.tsx         # Leaderboard + stream
    LiveGamesPage.tsx    # Active ranked games
    StatisticsPage.tsx   # LP graph + stat leaderboards

server/
  index.ts               # Express entry point, CSP, CORS
  routes/
    riot.ts              # /api/players, /api/live
    stats.ts             # /api/stats
    twitch.ts            # /api/twitch/status/:login, /api/twitch/pfp/:login
  cron/lpSnapshot.ts     # Cron scheduler: player sync + LP snapshots
  db/index.ts            # SQLite helpers (accounts, summoners, matches)
  riot/
    client.ts            # Riot API client
    dataCache.ts         # In-memory TTL cache
```

## Data & caching

- Match data is stored in a SQLite database (`matches.db`) — persists across restarts
- LP history is stored as JSON (`lp_history.json`) — entries older than 1 year are trimmed automatically
- Live game status is cached 30 seconds per player; Twitch status is cached 60 seconds
- The Riot API rate limiter caps at 90 requests per 2 minutes (personal key limit is 100)

## License

MIT
