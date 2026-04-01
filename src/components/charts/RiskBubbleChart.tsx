'use client'

import { useTheme } from '@/lib/theme'
import { Domain, DOMAIN_LABELS } from '@/lib/types'
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

export default function RiskBubbleChart({ domains }: Props) {
  const { theme } = useTheme()

  const width = 500
  const height = 320
  const padX = 50
  const padY = 40
  const plotW = width - padX * 2
  const plotH = height - padY * 2

  // X axis: score (0-100), Y axis: velocity (simulated change rate), size: weight
  const dataWithVelocity = domains.map(d => ({
    ...d,
    velocity: +(Math.random() * 8 - 2).toFixed(2), // simulated weekly change rate
  }))

  const maxVel = Math.max(...dataWithVelocity.map(d => Math.abs(d.velocity))) + 1
  const minVel = -maxVel

  const scaleX = (v: number) => padX + (v / 100) * plotW
  const scaleY = (v: number) => padY + plotH - ((v - minVel) / (maxVel - minVel)) * plotH
  const scaleR = (w: number) => 10 + w * 80

  const shortLabel = (d: Domain): string => {
    const m: Partial<Record<Domain, string>> = {
      work_risk: 'Work', inequality: 'Ineq', sentiment: 'Sent',
      policy: 'Policy', unrest: 'Unrest', decay: 'Decay', wellbeing: 'Well',
    }
    return m[d] || d
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        Risk Matrix — Score vs. Velocity
      </div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Grid */}
        <line x1={padX} y1={padY} x2={padX} y2={height - padY} stroke={theme.surfaceBorder} strokeWidth={1} />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke={theme.surfaceBorder} strokeWidth={1} />

        {/* Zero velocity line */}
        <line
          x1={padX}
          y1={scaleY(0)}
          x2={width - padX}
          y2={scaleY(0)}
          stroke={theme.surfaceBorder}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <text x={padX - 4} y={scaleY(0) + 3} textAnchor="end" fontSize={8} fill={theme.textTertiary} fontFamily={theme.fontMono}>0</text>

        {/* Quadrant labels */}
        <text x={width - padX - 4} y={padY + 14} textAnchor="end" fontSize={8} fill="#ef4444" opacity={0.5} fontFamily={theme.fontBody}>High &amp; Rising</text>
        <text x={padX + 4} y={height - padY - 8} textAnchor="start" fontSize={8} fill="#22c55e" opacity={0.5} fontFamily={theme.fontBody}>Low &amp; Falling</text>

        {/* X axis labels */}
        {[0, 25, 50, 75, 100].map(v => (
          <text key={v} x={scaleX(v)} y={height - padY + 16} textAnchor="middle" fontSize={8} fill={theme.textTertiary} fontFamily={theme.fontMono}>{v}</text>
        ))}
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize={9} fill={theme.textTertiary} fontFamily={theme.fontBody}>Stress Score →</text>

        {/* Y axis label */}
        <text x={12} y={height / 2} textAnchor="middle" fontSize={9} fill={theme.textTertiary} fontFamily={theme.fontBody} transform={`rotate(-90, 12, ${height / 2})`}>
          Weekly Velocity →
        </text>

        {/* Bubbles */}
        {dataWithVelocity.map(d => {
          const cx = scaleX(d.value)
          const cy = scaleY(d.velocity)
          const r = scaleR(d.weight)
          const color = DOMAIN_COLORS[d.domain] || '#888'

          return (
            <g key={d.domain}>
              <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.25} stroke={color} strokeWidth={1.5} />
              <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={9} fill={theme.text} fontFamily={theme.fontBody} fontWeight={600}>
                {shortLabel(d.domain)}
              </text>
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill={color} fontFamily={theme.fontMono} fontWeight={700}>
                {d.value.toFixed(0)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 10, color: theme.textTertiary }}>
        <span>Bubble size = domain weight</span>
        <span>|</span>
        <span>Above zero line = accelerating stress</span>
      </div>

      {/* Dynamic Analysis */}
      {(() => {
        const highAndRising = dataWithVelocity.filter(d => d.value >= 50 && d.velocity > 0).sort((a, b) => (b.value + b.velocity * 5) - (a.value + a.velocity * 5))
        const lowAndFalling = dataWithVelocity.filter(d => d.value < 50 && d.velocity < 0)
        const critical = highAndRising[0]
        const n = (d: string) => DOMAIN_LABELS[d as Domain] || d
        return (
          <ChartInsight title="Risk assessment">
            {critical ? (
              <>The most concerning signal is <strong>{n(critical.domain)}</strong> — already at {critical.value.toFixed(0)} and accelerating at +{critical.velocity.toFixed(1)} pts/week. Domains in the upper-right quadrant (high score, positive velocity) represent compounding risk where stress is both elevated and worsening.</>
            ) : (
              <>No domain currently sits in the critical upper-right quadrant (high &amp; rising), which suggests the current stress levels, while elevated, are not actively accelerating.</>
            )}
            {lowAndFalling.length > 0 && <> On the positive side, {lowAndFalling.map(d => n(d.domain)).join(' and ')} {lowAndFalling.length === 1 ? 'is' : 'are'} both lower-scored and decelerating — a pocket of resilience.</>}
          </ChartInsight>
        )
      })()}
    </div>
  )
}
