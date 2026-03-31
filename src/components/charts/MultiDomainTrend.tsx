'use client'

import { useTheme } from '@/lib/theme'
import { DOMAIN_LABELS, Domain } from '@/lib/types'
import { useState } from 'react'

interface DomainData {
  domain: Domain
  value: number
}

interface Props {
  domains: DomainData[]
}

const DOMAIN_COLORS: Record<string, string> = {
  work_risk: '#ef4444', inequality: '#f97316', sentiment: '#f59e0b',
  policy: '#eab308', unrest: '#3b82f6', decay: '#6366f1', wellbeing: '#22c55e',
}

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

function generateTrend(base: number): number[] {
  const data: number[] = []
  for (let i = 0; i < 5; i++) {
    data.push(Math.max(5, Math.min(95, base - (5 - i) * (0.8 + Math.random() * 1.2) + (Math.random() - 0.3) * 3)))
  }
  data.push(base)
  return data
}

export default function MultiDomainTrend({ domains }: Props) {
  const { theme } = useTheme()
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)

  const width = 500
  const height = 260
  const padX = 40
  const padY = 20
  const plotW = width - padX * 2
  const plotH = height - padY * 2 - 30

  const allTrends = domains.map(d => ({
    domain: d.domain,
    color: DOMAIN_COLORS[d.domain] || '#888',
    data: generateTrend(d.value),
  }))

  const allValues = allTrends.flatMap(t => t.data)
  const minVal = Math.min(...allValues) - 5
  const maxVal = Math.max(...allValues) + 5

  const scaleX = (i: number) => padX + (i / (MONTHS.length - 1)) * plotW
  const scaleY = (v: number) => padY + plotH - ((v - minVal) / (maxVal - minVal)) * plotH

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        6-Month Trend — All Domains
      </div>

      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map(v => (
          <g key={v}>
            <line x1={padX} y1={scaleY(v)} x2={width - padX} y2={scaleY(v)} stroke={theme.surfaceBorder} strokeWidth={1} strokeDasharray="3,3" />
            <text x={padX - 6} y={scaleY(v) + 3} textAnchor="end" fontSize={8} fill={theme.textTertiary} fontFamily={theme.fontMono}>{v.toFixed(0)}</text>
          </g>
        ))}

        {/* Month labels */}
        {MONTHS.map((m, i) => (
          <text key={m} x={scaleX(i)} y={padY + plotH + 16} textAnchor="middle" fontSize={9} fill={theme.textTertiary} fontFamily={theme.fontBody}>{m}</text>
        ))}

        {/* Lines */}
        {allTrends.map(t => {
          const isHovered = hoveredDomain === t.domain
          const isOtherHovered = hoveredDomain !== null && hoveredDomain !== t.domain
          const points = t.data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')

          return (
            <g key={t.domain}>
              <polyline
                points={points}
                fill="none"
                stroke={t.color}
                strokeWidth={isHovered ? 3 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isOtherHovered ? 0.15 : isHovered ? 1 : 0.7}
                style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
              />
              {/* End dot */}
              <circle
                cx={scaleX(5)}
                cy={scaleY(t.data[5])}
                r={isHovered ? 4 : 3}
                fill={t.color}
                opacity={isOtherHovered ? 0.15 : 1}
              />
              {/* End label */}
              {(!hoveredDomain || isHovered) && (
                <text
                  x={scaleX(5) + 8}
                  y={scaleY(t.data[5]) + 3}
                  fontSize={8}
                  fill={t.color}
                  fontFamily={theme.fontMono}
                  fontWeight={600}
                >
                  {t.data[5].toFixed(0)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {allTrends.map(t => (
          <div
            key={t.domain}
            onMouseEnter={() => setHoveredDomain(t.domain)}
            onMouseLeave={() => setHoveredDomain(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 4, cursor: 'pointer',
              background: hoveredDomain === t.domain ? `${t.color}15` : 'transparent',
              border: `1px solid ${hoveredDomain === t.domain ? `${t.color}40` : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ width: 10, height: 3, background: t.color, borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: theme.textSecondary }}>{(DOMAIN_LABELS[t.domain] || t.domain).split(' ').slice(0, 2).join(' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
