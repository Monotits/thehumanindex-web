'use client'

import { useTheme } from '@/lib/theme'
import { DOMAIN_LABELS, Domain } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { seededRandom } from '@/lib/seededRandom'
import ChartInsight from './ChartInsight'

interface DomainData {
  domain: Domain
  value: number
  weight: number
}

interface Props {
  domains: DomainData[]
}

const DOMAIN_COLORS: Record<string, string> = {
  work_risk: '#ef4444', inequality: '#f97316', sentiment: '#f59e0b',
  policy: '#eab308', unrest: '#3b82f6', decay: '#6366f1', wellbeing: '#22c55e',
}

function generateTrend(base: number, seed: string): number[] {
  const rng = seededRandom(`dombar-trend-${seed}`)
  const d: number[] = []
  for (let i = 0; i < 5; i++) d.push(Math.max(5, base - (5 - i) * 0.8 + (rng() - 0.3) * 3))
  d.push(base)
  return d
}

function generateDelta(seed: string): number {
  const rng = seededRandom(`dombar-delta-${seed}`)
  return +(rng() * 4 - 1.5).toFixed(2)
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 48
  const h = 16
  const min = Math.min(...data) - 2
  const max = Math.max(...data) + 2
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  )
}

export default function DomainComparisonBar({ domains }: Props) {
  const { theme } = useTheme()
  const sorted = [...domains].sort((a, b) => b.value - a.value)

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>
        Domain Analysis — Score, Trend &amp; Weight
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map(d => {
          const color = DOMAIN_COLORS[d.domain] || '#888'
          const delta = generateDelta(d.domain)
          const trend = generateTrend(d.value, d.domain)

          return (
            <div key={d.domain} className="domain-bar-row" style={{
              display: 'grid',
              gridTemplateColumns: '28px 130px 1fr 52px 48px 44px 32px',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 6,
              background: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
            }}>
              {/* Icon */}
              <DomainIcon domain={d.domain} size={18} color={color} />

              {/* Name */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{DOMAIN_LABELS[d.domain]}</div>
              </div>

              {/* Bar */}
              <div className="hide-mobile" style={{ position: 'relative', height: 8, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${d.value}%`, background: color, borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
                {/* 50-mark */}
                <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: theme.textTertiary, opacity: 0.3 }} />
              </div>

              {/* Score */}
              <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: theme.fontMono, textAlign: 'right' }}>
                {d.value.toFixed(1)}
              </div>

              {/* Sparkline */}
              <div className="hide-mobile"><MiniSparkline data={trend} color={color} /></div>

              {/* Delta */}
              <div className="hide-mobile" style={{
                fontSize: 11, fontFamily: theme.fontMono, textAlign: 'right',
                color: delta > 0 ? '#ef4444' : '#22c55e',
              }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(2)}
              </div>

              {/* Weight */}
              <div className="hide-mobile" style={{ fontSize: 10, color: theme.textTertiary, textAlign: 'right', fontFamily: theme.fontMono }}>
                {(d.weight * 100).toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Column headers hint */}
      <div className="domain-bar-header" style={{ display: 'grid', gridTemplateColumns: '28px 130px 1fr 52px 48px 44px 32px', gap: 8, padding: '6px 16px', fontSize: 8, color: theme.textTertiary }}>
        <span />
        <span />
        <span>Score bar (midline = 50)</span>
        <span style={{ textAlign: 'right' }}>Score</span>
        <span>6wk trend</span>
        <span style={{ textAlign: 'right' }}>WoW Δ</span>
        <span style={{ textAlign: 'right' }}>Wt</span>
      </div>

      {/* Dynamic Analysis */}
      {(() => {
        const above50 = sorted.filter(d => d.value >= 50)
        const below30 = sorted.filter(d => d.value < 30)
        const highest = sorted[0]
        const lowest = sorted[sorted.length - 1]
        const spread = highest.value - lowest.value
        return (
          <ChartInsight title="Domain overview">
            {above50.length} of 7 domains currently score above the 50-point midline, indicating {above50.length >= 5 ? 'broad-based stress across most dimensions' : above50.length >= 3 ? 'moderate stress concentrated in key areas' : 'stress that remains limited to a few domains'}.
            {' '}<strong>{DOMAIN_LABELS[highest.domain]}</strong> leads at {highest.value.toFixed(1)}, while <strong>{DOMAIN_LABELS[lowest.domain]}</strong> sits lowest at {lowest.value.toFixed(1)} — a spread of {spread.toFixed(0)} points.
            {spread > 30 && ' This wide disparity suggests highly uneven stress distribution, where certain systems face acute pressure while others remain relatively stable.'}
            {below30.length > 0 && ` ${below30.map(d => DOMAIN_LABELS[d.domain]).join(' and ')} ${below30.length === 1 ? 'remains' : 'remain'} in the low-stress zone, representing areas of relative resilience.`}
          </ChartInsight>
        )
      })()}
    </div>
  )
}
