import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { riotRouter } from './routes/riot.js'
import { statsRouter } from './routes/stats.js'
import { twitchRouter } from './routes/twitch.js'
import { startCron } from './cron/lpSnapshot.js'
import { riotClient } from './riot/client.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// Security & parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://player.twitch.tv"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
    }
  }
}))
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173' }))
app.use(express.json())

// API routes
app.use('/api', riotRouter)
app.use('/api/stats', statsRouter)
app.use('/api/twitch', twitchRouter)

// DDragon version endpoint
let ddragonVersion = '14.24.1'
riotClient.getDDragonVersion()
  .then(v => { ddragonVersion = v; console.log(`[DDragon] Version: ${v}`) })
  .catch(() => console.warn('[DDragon] Impossible de récupérer la version, fallback:', ddragonVersion))

app.get('/api/ddragon-version', (_req, res) => {
  res.json(ddragonVersion)
})

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[Serveur] Démarré sur http://localhost:${PORT}`)
})

startCron()
