import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TIER_ORDER, RANK_ORDER, PLAYER_COLORS } from '@/constants/ranks'
import type { LPSnapshot, PlayerConfig } from '@/types/riot'

// ─── Data ────────────────────────────────────────────────────────────────────

// 80 min gap minimum — filters legacy 15-min snapshots, keeps 90-min ones
const MIN_GAP_MS = 80 * 60 * 1000

function buildChartData(history: LPSnapshot[], players: PlayerConfig[]) {
  if (!history.length) return []

  // Group all entries by exact timestamp string (all players share one per cron run)
  const byTs = new Map<string, Record<string, number>>()
  for (const snap of history) {
    if (!byTs.has(snap.timestamp)) byTs.set(snap.timestamp, {})
    byTs.get(snap.timestamp)![snap.gameName] = snap.absoluteLP
  }

  const sorted = Array.from(byTs.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ts, values]) => ({ ts: new Date(ts).getTime(), ...values } as Record<string, number>))

  // Deduplicate: one point per 80-min window
  const deduped: typeof sorted = []
  for (const pt of sorted) {
    if (!deduped.length || pt.ts - deduped[deduped.length - 1].ts >= MIN_GAP_MS) {
      deduped.push({ ...pt })
    }
  }

  // Forward-fill: if a player has no value at a snapshot (sync failure),
  // carry their last known LP forward so every player has a dot at every mark.
  const lastKnown: Record<string, number> = {}
  for (const pt of deduped) {
    for (const p of players) {
      const v = pt[p.gameName]
      if (v !== undefined) {
        lastKnown[p.gameName] = v
      } else if (lastKnown[p.gameName] !== undefined) {
        pt[p.gameName] = lastKnown[p.gameName]
      }
    }
  }

  return deduped
}

// ─── Y-axis label ─────────────────────────────────────────────────────────────

const TIER_SHORT: Record<string, string> = {
  IRON: 'Fer', BRONZE: 'Br', SILVER: 'Arg', GOLD: 'Or',
  PLATINUM: 'Plat', EMERALD: 'Ém', DIAMOND: 'D',
}

function compactLabel(v: number): string {
  if (v < 0) return ''
  if (v >= 2800) return `${v - 2800} LP`
  const tierIndex = Math.min(Math.floor(v / 400), 6)
  const rem = v - tierIndex * 400
  const rankIndex = Math.min(Math.floor(rem / 100), 3)
  const lp = rem - rankIndex * 100
  const short = TIER_SHORT[TIER_ORDER[tierIndex]]
  return lp > 0 ? `${short} ${RANK_ORDER[rankIndex]} ${lp}` : `${short} ${RANK_ORDER[rankIndex]}`
}

function fullLabel(v: number): string {
  if (v < 0) return 'Non classé'
  if (v >= 2800) return `${v - 2800} LP`
  const tierIndex = Math.min(Math.floor(v / 400), 6)
  const rem = v - tierIndex * 400
  const rankIndex = Math.min(Math.floor(rem / 100), 3)
  const lp = rem - rankIndex * 100
  return `${TIER_SHORT[TIER_ORDER[tierIndex]]} ${RANK_ORDER[rankIndex]} ${lp} LP`
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: number
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || !label) return null
  const d = new Date(label)
  const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} `
    + `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
  return (
    <div className="rounded border border-lol-border bg-lol-navy px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-lol-gold/60">{dateStr}</p>
      {[...payload].sort((a, b) => b.value - a.value).map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-lol-gold-light/60 w-16">{p.name}</span>
          <span className="font-mono text-lol-gold-light">{fullLabel(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Graph ────────────────────────────────────────────────────────────────────

interface LPGraphProps {
  history: LPSnapshot[]
  players: PlayerConfig[]
}

export function LPGraph({ history, players }: LPGraphProps) {
  const data = buildChartData(history, players)

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-lol-gold-light/40">
        En attente de données (premier snapshot dans quelques minutes…)
      </div>
    )
  }

  // Y domain from actual data
  const allValues = data.flatMap(d =>
    players.map(p => d[p.gameName]).filter(v => typeof v === 'number')
  )
  if (!allValues.length) return null
  const minLP = Math.min(...allValues)
  const maxLP = Math.max(...allValues)
  const pad = Math.max(50, (maxLP - minLP) * 0.06)
  const yMin = Math.max(0, Math.floor((minLP - pad) / 100) * 100)
  const yMax = Math.ceil((maxLP + pad) / 100) * 100

  const yTicks: number[] = []
  for (let v = Math.floor(yMin / 200) * 200; v <= yMax; v += 200) {
    if (v >= yMin) yTicks.push(v)
  }

  const startTs = data[0].ts
  // Ensure at least 15h domain so the first dot sits at the left edge, not the center
  const endTs = Math.max(data[data.length - 1].ts, startTs + 15 * 60 * 60 * 1000)

  // Ticks every 15 hours → labels "0", "15", "30", "45"…
  // As more snapshots accumulate the dots pack tighter between ticks.
  const TICK_15H = 15 * 60 * 60 * 1000
  const xTicks: number[] = []
  for (let t = startTs; t <= endTs; t += TICK_15H) xTicks.push(t)

  const fmtHours = (ts: number) => String(Math.round((ts - startTs) / (60 * 60 * 1000)))

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#1e2d4560" strokeDasharray="0" />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={[startTs, endTs]}
          ticks={xTicks}
          tickFormatter={fmtHours}
          tick={{ fill: '#f0e6d240', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: '#1e2d45' }}
          padding={{ left: 0, right: 0 }}
        />
        <YAxis
          orientation="left"
          domain={[yMin, yMax]}
          ticks={yTicks}
          tick={{ fill: '#f0e6d240', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: '#1e2d45' }}
          tickFormatter={compactLabel}
          width={88}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#f0e6d280', paddingTop: 10 }} />
        {players.map((p, i) => {
          const color = p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length]
          return (
            <Line
              key={p.gameName}
              type="monotone"
              dataKey={p.gameName}
              name={p.displayName}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
