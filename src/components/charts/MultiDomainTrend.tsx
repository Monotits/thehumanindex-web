'use client'

import { useTheme } from '@/lib/theme'
import { DOMAIN_LABELS, Domain } from '@/lib/types'
import { seededRandom } from '@/lib/seededRandom'
import { useState } from 'react'
import ChartInsight from './ChartInsight'

interface DomainData {
  domain: Domain
  value: number
}

interface MonthlyRecord {
  year_month: string
  work_risk: number | null
  inequality: number | null
  unrest: number | null
  decay: number | null
  wellbeing: number | null
  policy: number | null
  sentiment: number | null
}

interface Props {
  domains: DomainData[]
  monthlyHistory?: MonthlyRecord[]
}

const DOMAIN_COLORS: Record<string, string> = {
  work_risk: '#ef4444', inequality: '#f97316', sentiment: '#f59e0b',
  policy: '#eab308', unrest: '#3b82f6', decay: '#6366f1', wellbeing: '#22c55e',
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthLabels(count: number): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(MONTH_SHORT[d.getMonth()])
  }
  return labels
}

/** Generate projected past data points leading up to the real value */
function generateProjected(currentValue: number, count: number, seed: string): number[] {
  const rng = seededRandom(`ghost-${seed}`)
  const data: number[] = []
  for (let i = 0; i < count; i++) {
    const distFromEnd = count - i
    const base = currentValue - distFromEnd * (0.6 + rng() * 0.8)
    const noise = (rng() - 0.4) * 2
    data.push(Math.max(5, Math.min(95, base + noise)))
  }
  return data
}

interface TrendPoint {
  value: number
  isReal: boolean
}

function buildDomainTrend(
  domain: string,
  currentValue: number,
  monthlyHistory: MonthlyRecord[] | undefined,
  totalMonths: number
): TrendPoint[] {
  const points: TrendPoint[] = []

  // Extract real historical values for this domain
  const realValues: { ym: string; value: number }[] = []
  if (monthlyHistory && monthlyHistory.length > 0) {
    for (const record of monthlyHistory) {
      const val = record[domain as keyof MonthlyRecord]
      if (typeof val === 'number' && val !== null) {
        realValues.push({ ym: record.year_month, value: val })
      }
    }
  }

  // How many real months do we have (up to totalMonths)?
  const recentReal = realValues.slice(-totalMonths)

  if (recentReal.length >= totalMonths) {
    // All months have real data
    return recentReal.map(r => ({ value: r.value, isReal: true }))
  }

  // Fill missing months with projected (ghost) data
  const projectedCount = totalMonths - recentReal.length - 1 // -1 for current month
  const firstRealValue = recentReal.length > 0 ? recentReal[0].value : currentValue
  const projected = generateProjected(firstRealValue, projectedCount, domain)

  for (const p of projected) {
    points.push({ value: p, isReal: false })
  }
  for (const r of recentReal) {
    points.push({ value: r.value, isReal: true })
  }
  // Add current value as the last real point
  const lastYM = recentReal.length > 0 ? recentReal[recentReal.length - 1].ym : ''
  const now = new Date()
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (lastYM !== currentYM) {
    points.push({ value: currentValue, isReal: true })
  }

  return points
}

export default function MultiDomainTrend({ domains, monthlyHistory }: Props) {
  const { theme } = useTheme()
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)

  const totalMonths = 6
  const months = buildMonthLabels(totalMonths)

  const width = 500
  const height = 260
  const padX = 40
  const padY = 20
  const plotW = width - padX * 2
  const plotH = height - padY * 2 - 30

  const allTrends = domains.map(d => {
    const trend = buildDomainTrend(d.domain, d.value, monthlyHistory, totalMonths)
    return {
      domain: d.domain,
      color: DOMAIN_COLORS[d.domain] || '#888',
      data: trend,
    }
  })

  const allValues = allTrends.flatMap(t => t.data.map(p => p.value))
  const minVal = Math.min(...allValues) - 5
  const maxVal = Math.max(...allValues) + 5

  const scaleX = (i: number) => padX + (i / (totalMonths - 1)) * plotW
  const scaleY = (v: number) => padY + plotH - ((v - minVal) / (maxVal - minVal)) * plotH

  // Check if we have any projected data
  const hasProjected = allTrends.some(t => t.data.some(p => !p.isReal))

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        6-Month Trend — All Domains
        {hasProjected && (
          <span style={{ fontSize: 9, color: theme.textTertiary, opacity: 0.6, marginLeft: 8, letterSpacing: 1 }}>
            (dashed = projected)
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', maxWidth: width }}>
        {/* Grid lines */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map(v => (
          <g key={v}>
            <line x1={padX} y1={scaleY(v)} x2={width - padX} y2={scaleY(v)} stroke={theme.surfaceBorder} strokeWidth={1} strokeDasharray="3,3" />
            <text x={padX - 6} y={scaleY(v) + 3} textAnchor="end" fontSize={8} fill={theme.textTertiary} fontFamily={theme.fontMono}>{v.toFixed(0)}</text>
          </g>
        ))}

        {/* Month labels */}
        {months.map((m, i) => (
          <text key={`${m}-${i}`} x={scaleX(i)} y={padY + plotH + 16} textAnchor="middle" fontSize={9} fill={theme.textTertiary} fontFamily={theme.fontBody}>{m}</text>
        ))}

        {/* Lines — split into segments: dashed for projected, solid for real */}
        {allTrends.map(t => {
          const isHovered = hoveredDomain === t.domain
          const isOtherHovered = hoveredDomain !== null && hoveredDomain !== t.domain
          const baseOpacity = isOtherHovered ? 0.15 : isHovered ? 1 : 0.7
          const sw = isHovered ? 3 : 1.5

          // Build segments: consecutive projected or consecutive real
          const segments: { points: string; isReal: boolean }[] = []
          let currentSegment: { indices: number[]; isReal: boolean } | null = null

          for (let i = 0; i < t.data.length; i++) {
            const isReal = t.data[i].isReal
            if (!currentSegment || currentSegment.isReal !== isReal) {
              // Start new segment, but overlap with last point of previous segment for continuity
              if (currentSegment) {
                segments.push({
                  points: currentSegment.indices.map(idx => `${scaleX(idx)},${scaleY(t.data[idx].value)}`).join(' '),
                  isReal: currentSegment.isReal,
                })
              }
              currentSegment = {
                indices: currentSegment ? [currentSegment.indices[currentSegment.indices.length - 1], i] : [i],
                isReal,
              }
            } else {
              currentSegment.indices.push(i)
            }
          }
          if (currentSegment) {
            segments.push({
              points: currentSegment.indices.map(idx => `${scaleX(idx)},${scaleY(t.data[idx].value)}`).join(' '),
              isReal: currentSegment.isReal,
            })
          }

          const lastIdx = t.data.length - 1

          return (
            <g key={t.domain}>
              {segments.map((seg, si) => (
                <polyline
                  key={si}
                  points={seg.points}
                  fill="none"
                  stroke={t.color}
                  strokeWidth={sw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={seg.isReal ? 'none' : '4,4'}
                  opacity={seg.isReal ? baseOpacity : baseOpacity * 0.45}
                  style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                />
              ))}

              {/* Dots: hollow for projected, filled for real */}
              {t.data.map((p, i) => (
                <circle
                  key={i}
                  cx={scaleX(i)}
                  cy={scaleY(p.value)}
                  r={i === lastIdx ? (isHovered ? 4 : 3) : 2}
                  fill={p.isReal ? t.color : 'transparent'}
                  stroke={p.isReal ? 'none' : t.color}
                  strokeWidth={1}
                  opacity={isOtherHovered ? 0.15 : p.isReal ? 1 : 0.4}
                />
              ))}

              {/* End label */}
              {(!hoveredDomain || isHovered) && (
                <text
                  x={scaleX(lastIdx) + 8}
                  y={scaleY(t.data[lastIdx].value) + 3}
                  fontSize={8}
                  fill={t.color}
                  fontFamily={theme.fontMono}
                  fontWeight={600}
                >
                  {t.data[lastIdx].value.toFixed(0)}
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

      {/* Dynamic Analysis */}
      {(() => {
        const steepest = [...allTrends].sort((a, b) => (b.data[b.data.length - 1].value - b.data[0].value) - (a.data[a.data.length - 1].value - a.data[0].value))[0]
        const mostImproved = [...allTrends].sort((a, b) => (a.data[a.data.length - 1].value - a.data[0].value) - (b.data[b.data.length - 1].value - b.data[0].value))[0]
        const steepDelta = (steepest.data[steepest.data.length - 1].value - steepest.data[0].value).toFixed(1)
        const improvDelta = (mostImproved.data[mostImproved.data.length - 1].value - mostImproved.data[0].value).toFixed(1)
        const converging = allTrends.every(t => Math.abs(t.data[t.data.length - 1].value - t.data[0].value) < 3)
        const n = (d: string) => DOMAIN_LABELS[d as Domain] || d
        const realMonths = allTrends[0]?.data.filter(p => p.isReal).length || 0
        return (
          <ChartInsight title="Trend analysis">
            {realMonths < 3 && <><em style={{ opacity: 0.6 }}>Based on limited data — dashed segments are projected.</em> </>}
            Over the past 6 months, <strong>{n(steepest.domain)}</strong> has risen the most sharply (+{steepDelta} pts), while <strong>{n(mostImproved.domain)}</strong> shows the most favorable trajectory ({improvDelta} pts).
            {converging
              ? ' All domains are moving within a narrow band, suggesting systemic pressure rather than isolated spikes.'
              : ' The divergence between domains indicates that stress is concentrated in specific areas rather than uniformly distributed — targeted intervention could have outsized impact.'}
          </ChartInsight>
        )
      })()}
    </div>
  )
}
