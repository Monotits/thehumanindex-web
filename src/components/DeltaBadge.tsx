import { formatDelta } from '@/lib/utils'

interface DeltaBadgeProps {
  delta: number | null
}

export function DeltaBadge({ delta }: DeltaBadgeProps) {
  if (delta === null || delta === undefined) {
    return null
  }

  const isPositive = delta > 0
  const formattedDelta = formatDelta(delta)
  const arrowIcon = isPositive ? '↑' : '↓'
  const colorClass = isPositive ? 'text-red-500' : 'text-green-500'

  return (
    <div className={`flex items-center gap-1 font-mono text-sm ${colorClass}`}>
      <span>{arrowIcon}</span>
      <span>{formattedDelta}</span>
    </div>
  )
}
