import { Band, BAND_COLORS, BAND_LABELS } from '@/lib/types'

interface BandLabelProps {
  band: Band
  size?: 'sm' | 'md' | 'lg'
}

export function BandLabel({ band, size = 'md' }: BandLabelProps) {
  const label = BAND_LABELS[band]
  const color = BAND_COLORS[band]

  const sizes = {
    sm: { padding: '4px 10px', fontSize: 11 },
    md: { padding: '6px 14px', fontSize: 13 },
    lg: { padding: '8px 18px', fontSize: 15 },
  }

  return (
    <div style={{
      ...sizes[size],
      borderRadius: 20,
      fontWeight: 600,
      color: '#fff',
      whiteSpace: 'nowrap',
      backgroundColor: color,
      display: 'inline-block',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {label}
    </div>
  )
}
