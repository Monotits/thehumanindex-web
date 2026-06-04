'use client'

import { useMemo, useState } from 'react'
import { useTheme } from '@/lib/theme'
import type {
  DashboardData, CountryRow, CompositeRow, MetaIndexRow, IndicatorRow, IndicatorValueRow,
} from './page'

const META_INDEX_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  economic: {
    label: 'Economic Stress',
    icon: '💼',
    description: 'Unemployment, inequality, and housing affordability pressures.',
  },
  social: {
    label: 'Social Stress',
    icon: '🤝',
    description: 'Fertility decline, divorce, social trust erosion, and loneliness.',
  },
  mental: {
    label: 'Mental Stress',
    icon: '🧠',
    description: 'Depression, anxiety, workplace burnout, and suicide.',
  },
  technological: {
    label: 'Technological Stress',
    icon: '🤖',
    description: 'AI job anxiety, screen time, and digital addiction.',
  },
  environmental: {
    label: 'Environmental Stress',
    icon: '🌡️',
    description: 'Temperature anomalies, water stress, and air pollution.',
  },
}

const BAND_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#3b82f6',
  elevated: '#f59e0b',
  high: '#ea580c',
  critical: '#dc2626',
}

function valueToBand(value: number | null): keyof typeof BAND_COLORS | null {
  if (value === null) return null
  if (value <= 25) return 'low'
  if (value <= 45) return 'moderate'
  if (value <= 65) return 'elevated'
  if (value <= 80) return 'high'
  return 'critical'
}

interface Props {
  data: DashboardData
}

export default function GlobalDashboardView({ data }: Props) {
  const { theme, themeId } = useTheme()
  const [selectedCountry, setSelectedCountry] = useState<string>('US')

  const compositeByCountry = useMemo(() => {
    const m = new Map<string, CompositeRow>()
    for (const c of data.composites) m.set(c.country_code, c)
    return m
  }, [data.composites])

  const metaByCountry = useMemo(() => {
    const m = new Map<string, MetaIndexRow[]>()
    for (const mi of data.metaIndexes) {
      if (!m.has(mi.country_code)) m.set(mi.country_code, [])
      m.get(mi.country_code)!.push(mi)
    }
    return m
  }, [data.metaIndexes])

  const indicatorById = useMemo(() => {
    const m = new Map<string, IndicatorRow>()
    for (const i of data.indicators) m.set(i.id, i)
    return m
  }, [data.indicators])

  const valuesForCountry = useMemo(() => {
    const m = new Map<string, IndicatorValueRow>()
    for (const v of data.indicatorValues) {
      if (v.country_code === selectedCountry) m.set(v.indicator_id, v)
    }
    return m
  }, [data.indicatorValues, selectedCountry])

  const country = data.countries.find(c => c.code === selectedCountry)
  const composite = compositeByCountry.get(selectedCountry)
  const metas = metaByCountry.get(selectedCountry) || []
  const bandColor = composite ? BAND_COLORS[composite.band] : '#888'

  const sectionStyle: React.CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: themeId === 'terminal' ? 4 : 10,
    padding: '24px 28px',
    marginBottom: 20,
  }

  // Sorted by stress score, for the ranking strip
  const ranked = useMemo(() => {
    return Array.from(compositeByCountry.values())
      .sort((a, b) => b.score_value - a.score_value)
  }, [compositeByCountry])

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', paddingTop: 40, paddingBottom: 48 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.text, fontFamily: theme.fontHeading, margin: '0 0 8px' }}>
            Global Dashboard
          </h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, fontFamily: theme.fontBody, margin: 0 }}>
            Human stress score across 5 meta-indexes for {data.countries.length} tracked countries.
          </p>
        </div>

        {/* Country selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
            Country
          </div>
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 360,
              padding: '10px 14px',
              fontSize: 15,
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: themeId === 'terminal' ? 3 : 8,
              fontFamily: theme.fontBody,
              cursor: 'pointer',
            }}
          >
            {data.countries.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag_emoji ? `${c.flag_emoji}  ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Composite score card */}
        {composite && (
          <div style={{ ...sectionStyle, textAlign: 'center', padding: '40px 28px' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>
              {country?.flag_emoji} {country?.name} — Composite Human Stress Score
            </div>
            <div style={{ fontSize: 64, fontWeight: 200, color: bandColor, lineHeight: 1, fontFamily: theme.fontMono }}>
              {composite.score_value.toFixed(1)}
            </div>
            <div style={{
              display: 'inline-block', margin: '14px auto 0', padding: '4px 14px', borderRadius: 6,
              background: `${bandColor}15`, border: `1px solid ${bandColor}30`,
              fontSize: 12, fontWeight: 700, color: bandColor, letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: theme.fontMono,
            }}>
              {composite.band}
            </div>
            {composite.delta !== null && composite.delta !== 0 && (
              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: composite.delta > 0 ? '#ef4444' : '#22c55e', fontFamily: theme.fontMono }}>
                  {composite.delta > 0 ? '▲' : '▼'} {Math.abs(composite.delta).toFixed(1)}
                </span>
                <span style={{ fontSize: 12, color: theme.textTertiary, marginLeft: 6 }}>vs. previous</span>
              </div>
            )}
            <div style={{ marginTop: 20, fontSize: 12, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 0.4 }}>
              {composite.meta_indexes_with_data}/{composite.meta_indexes_total} meta-indexes ·{' '}
              CONFIDENCE {composite.confidence !== null ? Math.round(composite.confidence * 100) : 0}%
            </div>
          </div>
        )}

        {/* 5 meta-index cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
          {(['economic', 'social', 'mental', 'technological', 'environmental'] as const).map(metaKey => {
            const mi = metas.find(m => m.meta_index === metaKey)
            const label = META_INDEX_LABELS[metaKey]
            const band = valueToBand(mi?.value ?? null)
            const color = band ? BAND_COLORS[band] : theme.textTertiary
            return (
              <div key={metaKey} style={{
                background: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                borderRadius: themeId === 'terminal' ? 4 : 10,
                padding: '18px 20px',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{label.icon}</div>
                <div style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                  {label.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 200, color, fontFamily: theme.fontMono, lineHeight: 1 }}>
                  {mi?.value !== null && mi?.value !== undefined ? mi.value.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 8, fontFamily: theme.fontMono }}>
                  {mi ? `${mi.indicators_with_data}/${mi.indicators_count} indicators` : 'no data'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicator breakdown per meta-index */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 18, color: theme.text, fontFamily: theme.fontHeading, margin: '0 0 16px' }}>
            Indicator Detail
          </h2>
          {(['economic', 'social', 'mental', 'technological', 'environmental'] as const).map(metaKey => {
            const groupIndicators = data.indicators.filter(i => i.meta_index === metaKey)
            const label = META_INDEX_LABELS[metaKey]
            return (
              <div key={metaKey} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>
                  {label.icon} {label.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {groupIndicators.map(ind => {
                    const v = valuesForCountry.get(ind.id)
                    const norm = v?.normalized_value ?? null
                    const band = valueToBand(norm)
                    const color = band ? BAND_COLORS[band] : theme.textTertiary
                    return (
                      <div key={ind.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '24px 1.5fr 1fr 1fr 80px',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: theme.bg,
                        borderRadius: themeId === 'terminal' ? 3 : 6,
                      }}>
                        <div style={{ fontSize: 16 }}>{ind.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, color: theme.text, fontFamily: theme.fontBody }}>
                            {ind.name}
                          </div>
                          <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                            {ind.source_org}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: theme.textSecondary, fontFamily: theme.fontMono }}>
                          {v?.raw_value !== null && v?.raw_value !== undefined
                            ? `${v.raw_value} ${ind.unit ?? ''}`.trim()
                            : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                          {v?.reference_date ? new Date(v.reference_date).getFullYear() : '—'}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color,
                          fontFamily: theme.fontMono,
                          fontWeight: 600,
                          textAlign: 'right',
                        }}>
                          {norm !== null ? norm.toFixed(1) : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Ranking strip (mini-leaderboard across all countries) */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 18, color: theme.text, fontFamily: theme.fontHeading, margin: '0 0 12px' }}>
            All Countries — Stress Ranking
          </h2>
          <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 16px', lineHeight: 1.5 }}>
            Sorted by composite stress score. Click any row to switch the dashboard to that country.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ranked.map((c, idx) => {
              const country = data.countries.find(x => x.code === c.country_code)
              const isSelected = c.country_code === selectedCountry
              const cBand = BAND_COLORS[c.band]
              return (
                <button
                  key={c.country_code}
                  onClick={() => setSelectedCountry(c.country_code)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 32px 1fr 80px 80px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: isSelected ? `${cBand}15` : theme.bg,
                    border: isSelected ? `1px solid ${cBand}50` : '1px solid transparent',
                    borderRadius: themeId === 'terminal' ? 3 : 6,
                    cursor: 'pointer',
                    fontFamily: theme.fontBody,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontSize: 18 }}>{country?.flag_emoji}</span>
                  <span style={{ fontSize: 13, color: theme.text }}>{country?.name}</span>
                  <span style={{
                    fontSize: 10,
                    color: cBand,
                    fontFamily: theme.fontMono,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    textAlign: 'right',
                  }}>
                    {c.band}
                  </span>
                  <span style={{
                    fontSize: 14,
                    color: cBand,
                    fontFamily: theme.fontMono,
                    fontWeight: 600,
                    textAlign: 'right',
                  }}>
                    {c.score_value.toFixed(1)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer explainer */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 18, color: theme.text, fontFamily: theme.fontHeading, margin: '0 0 12px' }}>
            About this view
          </h2>
          <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 10px' }}>
            The Human Index reorganized in 2026 around five consumer-facing stress meta-indexes — Economic,
            Social, Mental, Technological, and Environmental. Each meta-index aggregates 3-4 underlying
            indicators sourced from the World Bank, NASA GISS, OECD, IHME GBD, WHO, Gallup, and similar
            authoritative datasets.
          </p>
          <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 10px' }}>
            All scores are model estimates, not predictions. We compute them once per day for each
            country and surface them as bands (Low, Moderate, Elevated, High, Critical) to avoid false
            precision. See <a href="/data-sources" style={{ color: theme.accent }}>Data Sources</a> for
            per-source uptime and the <a href="/methodology" style={{ color: theme.accent }}>Methodology</a>
            {' '}page for the full computation logic.
          </p>
        </div>

      </div>
    </div>
  )
}
