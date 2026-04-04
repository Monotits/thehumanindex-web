'use client'

import { useTheme } from '@/lib/theme'
import { CorrelationInsight } from '@/lib/correlationInsights'
import { DOMAIN_LABELS } from '@/lib/types'

const SEVERITY_STYLES = {
  critical: { bg: '#ef444412', border: '#ef444440', icon: '⚠', color: '#ef4444' },
  warning:  { bg: '#f59e0b10', border: '#f59e0b35', icon: '◆', color: '#f59e0b' },
  info:     { bg: '#3b82f610', border: '#3b82f630', icon: '●', color: '#3b82f6' },
}

export default function CorrelationInsightsPanel({ insights }: { insights: CorrelationInsight[] }) {
  const { theme } = useTheme()

  if (!insights || insights.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, letterSpacing: 2, color: theme.textTertiary,
        textTransform: 'uppercase', marginBottom: 16, padding: '0 4px',
      }}>
        Cross-Domain Correlations ({insights.length} detected)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {insights.map(insight => {
          const style = SEVERITY_STYLES[insight.severity]
          return (
            <div key={insight.id} style={{
              background: theme.surface,
              border: `1px solid ${style.border}`,
              borderRadius: 12,
              padding: 24,
              borderLeft: `3px solid ${style.color}`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 16, color: style.color }}>{style.icon}</span>
                <span style={{
                  fontSize: 15, fontWeight: 700,
                  color: theme.isDark ? '#fff' : theme.text,
                }}>
                  {insight.title}
                </span>
                <span style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 4,
                  background: style.bg, color: style.color,
                  fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                }}>
                  {insight.severity}
                </span>
              </div>

              {/* Domain tags */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {insight.domains.map(d => (
                  <span key={d} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: `${theme.accent}12`, color: theme.accent,
                    fontFamily: theme.fontMono,
                  }}>
                    {DOMAIN_LABELS[d] || d}
                  </span>
                ))}
              </div>

              {/* Data points */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(insight.dataPoints.length, 4)}, 1fr)`,
                gap: 12, marginBottom: 16,
              }}>
                {insight.dataPoints.map((dp, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: theme.isDark ? '#ffffff06' : '#00000004',
                    border: `1px solid ${theme.surfaceBorder}`,
                  }}>
                    <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4, lineHeight: 1.3 }}>
                      {dp.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{
                        fontSize: 18, fontWeight: 300, fontFamily: theme.fontMono,
                        color: theme.isDark ? '#fff' : theme.text,
                      }}>
                        {dp.value}
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: dp.trend === 'up' ? '#ef4444' : dp.trend === 'down' ? '#22c55e' : theme.textTertiary,
                      }}>
                        {dp.trend === 'up' ? '▲' : dp.trend === 'down' ? '▼' : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commentary */}
              <div style={{
                fontSize: 13, color: theme.textSecondary, lineHeight: 1.7,
                borderTop: `1px solid ${theme.surfaceBorder}`, paddingTop: 14,
              }}>
                {insight.commentary}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
