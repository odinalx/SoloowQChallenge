import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function winRate(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '—'
  return `${Math.round((wins / total) * 100)}%`
}

export const ddragon = {
  profileIcon: (iconId: number, version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`,
  championIcon: (name: string, version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${name}.png`,
  rankEmblem: (tier: string) =>
    `https://opgg-static.akamaized.net/images/medals_new/${tier.toLowerCase()}.png`,
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}
