export const TIER_ORDER = [
  'IRON', 'BRONZE', 'SILVER', 'GOLD',
  'PLATINUM', 'EMERALD', 'DIAMOND',
  'MASTER', 'GRANDMASTER', 'CHALLENGER'
] as const

export const RANK_ORDER = ['IV', 'III', 'II', 'I'] as const

export function computeAbsoluteLP(tier: string, rank: string, lp: number): number {
  const tierIndex = TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number])
  const rankIndex = RANK_ORDER.indexOf(rank as typeof RANK_ORDER[number])
  if (tierIndex === -1) return lp
  // For Master+ there's no rank division
  if (tierIndex >= 7) return tierIndex * 400 + lp
  return tierIndex * 400 + rankIndex * 100 + lp
}

export function absoluteLPToLabel(absoluteLP: number): string {
  if (absoluteLP < 0) return 'Non classé'
  const tierIndex = Math.min(Math.floor(absoluteLP / 400), TIER_ORDER.length - 1)
  const tier = TIER_ORDER[tierIndex]
  if (tierIndex >= 7) {
    const lp = absoluteLP - tierIndex * 400
    return `${TIER_FR[tier]} ${lp} PL`
  }
  const remainder = absoluteLP - tierIndex * 400
  const rankIndex = Math.min(Math.floor(remainder / 100), 3)
  const rank = RANK_ORDER[rankIndex]
  const lp = remainder - rankIndex * 100
  return `${TIER_FR[tier]} ${rank} ${lp} PL`
}

export const TIER_FR: Record<string, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  EMERALD: 'Émeraude',
  DIAMOND: 'Diamant',
  MASTER: 'Maître',
  GRANDMASTER: 'Grand Maître',
  CHALLENGER: 'Challenger',
}

export function formatRankFR(tier: string, rank: string, lp: number): string {
  const tierName = TIER_FR[tier] ?? tier
  const tierIndex = TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number])
  if (tierIndex >= 7) return `${tierName} ${lp} PL`
  return `${tierName} ${rank} — ${lp} PL`
}

export const PLAYER_COLORS = [
  '#c8aa6e', // gold
  '#0397ab', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
]
