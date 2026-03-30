import { Band, BAND_COLORS, BAND_LABELS } from '@/lib/types'

interface BandLabelProps {
  band: Band
  size?: 'sm' | 'md' | 'lg'
}

export function BandLabel({ band, size = 'md' }: BandLabelProps) {
  const label = BAND_LABELS[band]
  const color = BAND_COLORS[band]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full font-semibold text-white whitespace-nowrap`}
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  )
}
