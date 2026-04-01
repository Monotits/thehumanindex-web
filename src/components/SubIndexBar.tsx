'use client'

import { SubIndex } from '@/lib/types'
import { DOMAIN_LABELS, BAND_COLORS } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { scoreToBand } from '@/lib/utils'

interface SubIndexBarProps {
  subIndex: SubIndex
}

export function SubIndexBar({ subIndex }: SubIndexBarProps) {
  const band = scoreToBand(subIndex.value)
  const color = BAND_COLORS[band]
  const label = DOMAIN_LABELS[subIndex.domain]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DomainIcon domain={subIndex.domain} size={20} color={color} />
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-white">{Math.round(subIndex.value)}</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(subIndex.value, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}
