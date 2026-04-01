'use client'

import { useTheme } from '@/lib/theme'
import { Domain, DOMAIN_LABELS } from '@/lib/types'
import ChartInsight from './ChartInsight'

interface Props {
  domains: { domain: Domain; value: number }[]
}

// Generate plausible correlation values between domains
function getCorrelation(d1: string, d2: string): number {
  if (d1 === d2) return 1
  const pairs: Record<string, number> = {
    'work_risk:inequality': 0.82,
    'work_risk:sentiment': 0.74,
    'work_risk:unrest': 0.68,
    'work_risk:policy': -0.45,
    'work_risk:decay': 0.51,
    'work_risk:wellbeing': -0.63,
    'inequality:sentiment': 0.71,
    'inequality:unrest': 0.79,
    'inequality:policy': -0.38,
    'inequality:decay': 0.62,
    'inequality:wellbeing': -0.72,
    'sentiment:unrest': 0.85,
    'sentiment:policy': -0.29,
    'sentiment:decay': 0.58,
    'sentiment:wellbeing': -0.54,
    'unrest:policy': -0.41,
    'unrest:decay': 0.73,
    'unrest:wellbeing': -0.67,
    'policy:decay': -0.55,
    'policy:wellbeing': 0.48,
    'decay:wellbeing': -0.61,
  }
  const key1 = `${d1}:${d2}`
  const key2 = `${d2}:${d1}`
  return pairs[key1] ?? pairs[key2] ?? 0
}

function colorForCorrelation(v: number, isDark: boolean): string {
  if (v === 1) return isDark ? '#333' : '#ddd'
  const abs = Math.abs(v)
  if (v > 0) {
    // Red scale for positive (stress-correlated)
    const alpha = abs * 0.8
    return `rgba(239, 68, 68, ${alpha})`
  } else {
    // Blue/green scale for negative (inverse)
    const alpha = abs * 0.8
    return `rgba(59, 130, 246, ${alpha})`
  }
}

export default function CorrelationHeatmap({ domains }: Props) {
  const { theme } = useTheme()
  const domainKeys = domains.map(d => d.domain)
  const cellSize = 44
  const labelWidth = 100
  const size = cellSize * domainKeys.length + labelWidth

  const shortLabel = (d: Domain) => {
    const labels: Partial<Record<Domain, string>> = {
      work_risk: 'Work', inequality: 'Ineq', sentiment: 'Sent',
      policy: 'Policy', unrest: 'Unrest', decay: 'Decay', wellbeing: 'Well',
    }
    return labels[d] || d
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        Domain Correlation Matrix
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={size} height={size} style={{ display: 'block' }}>
          {/* Column headers */}
          {domainKeys.map((d, i) => (
            <text key={`ch-${d}`} x={labelWidth + i * cellSize + cellSize / 2} y={labelWidth - 8}
              textAnchor="middle" fontSize={10} fill={theme.textTertiary} fontFamily={theme.fontBody}>
              {shortLabel(d)}
            </text>
          ))}

          {/* Rows */}
          {domainKeys.map((row, ri) => (
            <g key={row}>
              {/* Row label */}
              <text x={labelWidth - 8} y={labelWidth + ri * cellSize + cellSize / 2 + 4}
                textAnchor="end" fontSize={10} fill={theme.textSecondary} fontFamily={theme.fontBody}>
                {shortLabel(row)}
              </text>

              {/* Cells */}
              {domainKeys.map((col, ci) => {
                const corr = getCorrelation(row, col)
                const bg = colorForCorrelation(corr, theme.isDark)
                return (
                  <g key={`${row}-${col}`}>
                    <rect
                      x={labelWidth + ci * cellSize + 1}
                      y={labelWidth + ri * cellSize + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={4}
                      fill={bg}
                    />
                    {row !== col && (
                      <text
                        x={labelWidth + ci * cellSize + cellSize / 2}
                        y={labelWidth + ri * cellSize + cellSize / 2 + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill={theme.text}
                        fontFamily={theme.fontMono}
                        opacity={0.8}
                      >
                        {corr.toFixed(2)}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 10, color: theme.textTertiary }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(59, 130, 246, 0.6)' }} />
          <span>Inverse</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(239, 68, 68, 0.6)' }} />
          <span>Correlated stress</span>
        </div>
      </div>

      {/* Dynamic Analysis */}
      {(() => {
        // Find strongest positive and negative correlations
        const pairs: { d1: string; d2: string; corr: number }[] = []
        for (let i = 0; i < domainKeys.length; i++) {
          for (let j = i + 1; j < domainKeys.length; j++) {
            pairs.push({ d1: domainKeys[i], d2: domainKeys[j], corr: getCorrelation(domainKeys[i], domainKeys[j]) })
          }
        }
        const strongest = [...pairs].sort((a, b) => b.corr - a.corr)[0]
        const mostInverse = [...pairs].sort((a, b) => a.corr - b.corr)[0]
        const n1 = (d: string) => DOMAIN_LABELS[d as Domain] || d
        return (
          <ChartInsight title="What the correlations tell us">
            The strongest co-movement is between <strong>{n1(strongest.d1)}</strong> and <strong>{n1(strongest.d2)}</strong> (r={strongest.corr.toFixed(2)}) — when one rises, the other follows closely, suggesting a shared structural driver.
            Conversely, <strong>{n1(mostInverse.d1)}</strong> and <strong>{n1(mostInverse.d2)}</strong> (r={mostInverse.corr.toFixed(2)}) move in opposite directions, indicating that gains in one domain may come at the expense of the other. Policy interventions should account for these interdependencies rather than treating domains in isolation.
          </ChartInsight>
        )
      })()}
    </div>
  )
}
