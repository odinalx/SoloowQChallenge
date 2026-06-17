import { cn } from '@/lib/utils'

interface MatchBadgeProps {
  win: boolean
}

export function MatchBadge({ win }: MatchBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
        win
          ? 'bg-win/20 text-win'
          : 'bg-loss/20 text-loss'
      )}
    >
      {win ? 'V' : 'D'}
    </span>
  )
}
