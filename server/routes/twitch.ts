import { Router } from 'express'
import { cache } from '../riot/dataCache.js'

export const twitchRouter = Router()

let appToken: string | null = null
let tokenExpiresAt = 0

async function getAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const secret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !secret) return null
  if (appToken && Date.now() < tokenExpiresAt) return appToken
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!res.ok) return null
  const data = await res.json() as { access_token: string; expires_in: number }
  appToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
  return appToken
}

twitchRouter.get('/channel', (_req, res) => {
  const channel = process.env.TWITCH_CHANNEL ?? ''
  res.json({ channel, isConfigured: Boolean(channel) })
})

twitchRouter.get('/status/:login', async (req, res) => {
  const login = encodeURIComponent(req.params.login)
  const key = `twitch:live:${login}`
  if (cache.has(key)) return res.json({ isLive: cache.get<boolean>(key) ?? false })

  const token = await getAppToken().catch(() => null)
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!token || !clientId) {
    cache.set(key, false, 60_000)
    return res.json({ isLive: false })
  }
  try {
    const r = await fetch(`https://api.twitch.tv/helix/streams?user_login=${login}`, {
      headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId }
    })
    const d = await r.json() as { data: unknown[] }
    const isLive = d.data.length > 0
    cache.set(key, isLive, 30_000)
    res.json({ isLive })
  } catch {
    cache.set(key, false, 30_000)
    res.json({ isLive: false })
  }
})

twitchRouter.get('/pfp/:login', async (req, res) => {
  const login = encodeURIComponent(req.params.login)
  const key = `twitch:pfp:${login}`
  if (cache.has(key)) return res.json({ url: cache.get<string | null>(key) })

  const token = await getAppToken().catch(() => null)
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!token || !clientId) {
    cache.set(key, null, 24 * 60 * 60 * 1000)
    return res.json({ url: null })
  }
  try {
    const r = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
      headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId }
    })
    const d = await r.json() as { data: Array<{ profile_image_url: string }> }
    const url = d.data[0]?.profile_image_url ?? null
    cache.set(key, url, 24 * 60 * 60 * 1000)
    res.json({ url })
  } catch {
    cache.set(key, null, 60 * 60 * 1000)
    res.json({ url: null })
  }
})
