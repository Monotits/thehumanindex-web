'use client'

import { useTheme } from '@/lib/theme'
import { DOMAIN_LABELS, Domain } from '@/lib/types'
import ChartInsight from './ChartInsight'

interface Props {
  domains: { domain: Domain; value: number; weight: number }[]
  compositeScore: number
}

export default function WaterfallChart({ domains, compositeScore }: Props) {
  const { theme } = useTheme()
  const sorted = [...domains].sort((a, b) => (b.value * b.weight) - (a.value * a.weight))

  const barWidth = 40
  const gap = 8
  const chartWidth = (barWidth + gap) * (sorted.length + 1) + 60
  const chartHeight = 200
  const scale = (chartHeight - 40) / compositeScore

  let cumulative = 0

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        Composite Score Breakdown — Weighted Contribution
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`} width="100%" style={{ display: 'block', maxWidth: chartWidth }}>
          {/* Bars */}
          {sorted.map((d, i) => {
            const contribution = d.value * d.weight
            const barH = contribution * scale
            const x = 40 + i * (barWidth + gap)
            const prevCum = cumulative
            cumulative += contribution

            const color = d.value >= 65 ? '#ef4444' : d.value >= 45 ? '#f97316' : d.value >= 25 ? '#3b82f6' : '#22c55e'

            return (
              <g key={d.domain}>
                {/* Connector line */}
                {i > 0 && (
                  <line
                    x1={x - gap}
                    y1={chartHeight - prevCum * scale}
                    x2={x}
                    y2={chartHeight - prevCum * scale}
                    stroke={theme.surfaceBorder}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                )}
                {/* Bar */}
                <rect
                  x={x}
                  y={chartHeight - cumulative * scale}
                  width={barWidth}
                  height={barH}
                  fill={color}
                  rx={3}
                  opacity={0.85}
                />
                {/* Value label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - cumulative * scale - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill={theme.text}
                  fontFamily={theme.fontMono}
                >
                  +{contribution.toFixed(1)}
                </text>
                {/* Domain label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  fontSize={8}
                  fill={theme.textTertiary}
                  fontFamily={theme.fontBody}
                >
                  {(DOMAIN_LABELS[d.domain] || d.domain).split(' ')[0]}
                </text>
                {/* Weight */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 28}
                  textAnchor="middle"
                  fontSize={7}
                  fill={theme.textTertiary}
                  fontFamily={theme.fontMono}
                  opacity={0.6}
                >
                  {(d.weight * 100).toFixed(0)}%w
                </text>
              </g>
            )
          })}

          {/* Total bar */}
          {(() => {
            const x = 40 + sorted.length * (barWidth + gap)
            const totalH = compositeScore * scale
            return (
              <g>
                <line
                  x1={x - gap}
                  y1={chartHeight - cumulative * scale}
                  x2={x}
                  y2={chartHeight - cumulative * scale}
                  stroke={theme.surfaceBorder}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <rect
                  x={x}
                  y={chartHeight - totalH}
                  width={barWidth}
                  height={totalH}
                  fill={theme.accent}
                  rx={3}
                  opacity={0.9}
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - totalH - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill={theme.accent}
                  fontFamily={theme.fontMono}
                  fontWeight={700}
                >
                  {compositeScore.toFixed(1)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill={theme.text}
                  fontFamily={theme.fontBody}
                  fontWeight={600}
                >
                  Total
                </text>
              </g>
            )
          })()}

          {/* Y axis baseline */}
          <line x1={38} y1={chartHeight} x2={chartWidth - 10} y2={chartHeight} stroke={theme.surfaceBorder} strokeWidth={1} />
        </svg>
      </div>

      {/* Dynamic Analysis */}
      {(() => {
        const top = sorted[0]
        const topContrib = (top.value * top.weight)
        const topPct = ((topContrib / compositeScore) * 100).toFixed(0)
        const top3 = sorted.slice(0, 3)
        const top3Pct = ((top3.reduce((s, d) => s + d.value * d.weight, 0) / compositeScore) * 100).toFixed(0)
        return (
          <ChartInsight title="Score decomposition">
            <strong>{DOMAIN_LABELS[top.domain]}</strong> is the single largest contributor to the composite, accounting for {topPct}% of the total score (weighted contribution: {topContrib.toFixed(1)} pts). The top three domains together drive {top3Pct}% of the index — a concentration that makes the composite highly sensitive to shifts in these areas. Domains with lower weights, even if scored high, have limited ability to move the overall needle.
          </ChartInsight>
        )
      })()}
    </div>
  )
}
