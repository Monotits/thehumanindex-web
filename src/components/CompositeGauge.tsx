'use client'

import { CompositeScore } from '@/lib/types'
import { BAND_COLORS } from '@/lib/types'
import { DeltaBadge } from './DeltaBadge'
import { BandLabel } from './BandLabel'

interface CompositeGaugeProps {
  score: CompositeScore
}

export function CompositeGauge({ score }: CompositeGaugeProps) {
  const percentage = (score.score_value / 100) * 100
  const color = BAND_COLORS[score.band]

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative w-48 h-48">
        {/* Circular gauge background */}
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#374151" strokeWidth="20" />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeDasharray={`${(percentage / 100) * 565.48} 565.48`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-white">{Math.round(score.score_value)}</div>
          <div className="text-sm text-gray-400">/ 100</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <BandLabel band={score.band} size="lg" />
        {score.delta !== null && <DeltaBadge delta={score.delta} />}
      </div>

      <div className="text-xs text-gray-500 text-center max-w-xs">
        Civilization Stress Index
      </div>
    </div>
  )
}
