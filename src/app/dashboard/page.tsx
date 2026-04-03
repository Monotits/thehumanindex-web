'use client'

import { useEffect, useState } from 'react'
import { CompositeScore, DOMAIN_LABELS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface RealDataResponse {
  scores: {
    composite: number
    domains: Record<string, { score: number | null; sources: string[]; dataPoints: unknown[]; hasData: boolean }>
    band: string
    activeDomains: number
    totalDomains: number
    sources_connected: string[]
    sources_missing: string[]
  }
  raw_points: { domain: string; indicator: string; value: number; normalized: number; source: string; series: string; period: string; context: string }[]
  errors: string[]
  fetched_at: string
}

const DOMAIN_SLUGS: Record<string, string> = {
  work_risk: 'ai-work-displacement',
  inequality: 'income-inequality',
  unrest: 'social-unrest',
  decay: 'institutional-decay',
  wellbeing: 'social-wellbeing',
  policy: 'policy-response',
  sentiment: 'public-sentiment',
}

const DOMAIN_SHORT_DESC: Record<string, string> = {
  work_risk: 'AI adoption pressure on jobs and labor market stability.',
  inequality: 'Wealth concentration, income gaps, and economic opportunity.',
  unrest: 'Political instability, civic disengagement, and social tension.',
  decay: 'Governance effectiveness, rule of law, corruption control.',
  wellbeing: 'Population health, financial security, and mental health.',
  policy: 'Government fiscal capacity and policy responsiveness.',
  sentiment: 'Consumer confidence, economic optimism, public mood.',
}

function getBandColor(band: string, theme: ReturnType<typeof useTheme>['theme']): string {
  switch (band) {
    case 'critical': return '#ef4444'
    case 'high': return '#f97316'
    case 'elevated': return '#f59e0b'
    case 'moderate': return '#3b82f6'
    case 'low': return '#22c55e'
    default: return theme.accent
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 55) return '#f97316'
  if (score >= 40) return '#f59e0b'
  if (score >= 25) return '#3b82f6'
  return '#22c55e'
}

export default function DashboardPage() {
  const [score, setScore] = useState<CompositeScore | null>(null)
  const [historicalData, setHistoricalData] = useState<{ date: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSources, setDataSources] = useState<string[]>([])
  const [missingSourcesList, setMissingSources] = useState<string[]>([])
  const [rawPoints, setRawPoints] = useState<RealDataResponse['raw_points']>([])
  const [errors, setErrors] = useState<string[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Read latest score from Supabase (populated by cron job)
        try {
          const { data: scores, error } = await supabase
            .from('composite_scores')
            .select('*, sub_indexes(*)')
            .eq('score_type', 'composite')
            .order('computed_at', { ascending: false })
            .limit(1)

          if (!error && scores && scores.length > 0) {
            const s = scores[0] as CompositeScore
            setScore(s)

            // Extract sources from metadata (written by cron)
            const meta = s.metadata as Record<string, unknown> | null
            if (meta?.sources_connected) setDataSources(meta.sources_connected as string[])
            if (meta?.sources_missing) setMissingSources(meta.sources_missing as string[])
            if (meta?.errors) setErrors(meta.errors as string[])

            // Extract raw data points from sub_indexes
            const points: RealDataResponse['raw_points'] = []
            for (const sub of s.sub_indexes || []) {
              const rd = sub.raw_data as Record<string, unknown> | null
              if (rd?.dataPoints && Array.isArray(rd.dataPoints)) {
                for (const dp of rd.dataPoints) {
                  points.push(dp as RealDataResponse['raw_points'][0])
                }
              }
            }
            if (points.length > 0) setRawPoints(points)
          }
        } catch {
          // Supabase not available
        }

        // 2. Load historical trend data from monthly_scores
        try {
          const { data: history, error: histError } = await supabase
            .from('monthly_scores')
            .select('year_month, composite')
            .order('year_month', { ascending: true })
            .limit(12)

          if (!histError && history && history.length > 0) {
            const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            setHistoricalData(history.map((h: { year_month: string; composite: number }) => {
              const [, monthStr] = h.year_month.split('-')
              return {
                date: MONTH_SHORT[parseInt(monthStr, 10) - 1],
                score: Number(h.composite),
              }
            }))
          }
        } catch {
          // No historical data
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: theme.textTertiary, marginBottom: 8 }}>Loading dashboard...</div>
          <div style={{ fontSize: 11, color: theme.textTertiary, opacity: 0.6 }}>Reading cached scores</div>
        </div>
      </div>
    )
  }

  const hasScore = score && score.score_value > 0
  const sortedDomains = [...(score?.sub_indexes || [])].sort((a, b) => b.value - a.value)
  const bandColor = hasScore ? getBandColor(score!.band, theme) : theme.textTertiary
  const activeDomains = sortedDomains.filter(d => {
    const rd = d.raw_data as Record<string, unknown> | null
    return rd?.hasData !== false && d.value > 0
  })
  const pendingDomains = sortedDomains.filter(d => {
    const rd = d.raw_data as Record<string, unknown> | null
    return rd?.hasData === false || d.value === 0
  })

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0 }}>
            Real-time civilizational stress monitoring
            {hasScore && <> — Updated {formatDate(score!.computed_at)}</>}
          </p>
        </div>

        {/* No data state */}
        {!hasScore && (
          <div style={{
            background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12,
            padding: 32, marginBottom: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 12 }}>
              Waiting for Data Sources
            </div>
            <p style={{ fontSize: 14, color: theme.textSecondary, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
              The index is computed from live data feeds (FRED, World Bank, BLS, OECD, WHO).
              Data sources connect automatically — scores will appear once feeds are active.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {['FRED', 'World Bank', 'BLS', 'OECD', 'WHO', 'O*NET'].map(s => {
                const connected = dataSources.includes(s)
                return (
                  <span key={s} style={{
                    fontSize: 11, padding: '4px 12px', borderRadius: 12, fontFamily: theme.fontMono,
                    background: connected ? `${theme.accent}15` : `${theme.surfaceBorder}`,
                    border: `1px solid ${connected ? theme.accent + '30' : theme.surfaceBorder}`,
                    color: connected ? theme.accent : theme.textTertiary,
                  }}>
                    {connected ? '●' : '○'} {s}
                  </span>
                )
              })}
            </div>
            {errors.length > 0 && (
              <div style={{ marginTop: 16, fontSize: 11, color: '#f59e0b', fontFamily: theme.fontMono }}>
                {errors.length} source{errors.length > 1 ? 's' : ''} returned errors
              </div>
            )}
          </div>
        )}

        {/* Score + Chart */}
        {hasScore && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
            {/* Big Number */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>
                Composite Index
              </div>
              <div style={{ fontSize: 56, fontWeight: 200, color: bandColor, lineHeight: 1, fontFamily: theme.fontMono }}>
                {score!.score_value.toFixed(1)}
              </div>
              <div style={{
                display: 'inline-block', margin: '12px auto 0', padding: '4px 14px', borderRadius: 6,
                background: `${bandColor}15`, border: `1px solid ${bandColor}30`,
                fontSize: 11, fontWeight: 700, color: bandColor, letterSpacing: 2, textTransform: 'uppercase',
              }}>
                {score!.band}
              </div>
              {score!.delta !== null && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: score!.delta > 0 ? '#ef4444' : '#22c55e' }}>
                    {score!.delta > 0 ? '▲' : '▼'} {Math.abs(score!.delta).toFixed(1)}
                  </span>
                  <span style={{ fontSize: 12, color: theme.textTertiary, marginLeft: 6 }}>WoW</span>
                </div>
              )}
              <div style={{ marginTop: 16, fontSize: 11, color: theme.textTertiary }}>
                {activeDomains.length}/{sortedDomains.length} domains active
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>
                {historicalData.length > 1 ? 'Historical Trend' : 'Current Reading'}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historicalData.length > 0 ? historicalData : [
                  { date: formatDate(score!.computed_at), score: score!.score_value },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.surfaceBorder} />
                  <XAxis dataKey="date" tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke={theme.surfaceBorder} />
                  <YAxis domain={[0, 100]} tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke={theme.surfaceBorder} />
                  <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke={bandColor} strokeWidth={2} dot={{ fill: bandColor, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              {historicalData.length <= 1 && (
                <p style={{ fontSize: 11, color: theme.textTertiary, textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
                  Trend data will build up as more weekly readings are collected.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Domain Breakdown */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase' }}>Domain Breakdown</div>
            <Link href="/glossary" style={{ fontSize: 12, color: theme.accent, textDecoration: 'none' }}>
              Learn about each domain →
            </Link>
          </div>

          {/* Active domains */}
          {activeDomains.map(d => {
            const color = getScoreColor(d.value)
            const slug = DOMAIN_SLUGS[d.domain]
            const desc = DOMAIN_SHORT_DESC[d.domain]
            const sources = d.raw_data && (d.raw_data as Record<string, string[]>).sources
              ? (d.raw_data as Record<string, string[]>).sources
              : null
            return (
              <div key={d.domain} style={{ padding: '14px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <Link href={`/glossary/${slug}`} style={{
                    flex: '0 0 200px', fontSize: 14, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text,
                    textDecoration: 'none',
                  }}>
                    {DOMAIN_LABELS[d.domain] || d.domain}
                  </Link>
                  <div style={{ flex: 1, height: 8, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 4, marginRight: 16 }}>
                    <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ flex: '0 0 45px', fontFamily: theme.fontMono, fontSize: 15, fontWeight: 600, color, textAlign: 'right' }}>
                    {d.value.toFixed(0)}
                  </div>
                  <div style={{ flex: '0 0 45px', fontSize: 11, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 0 }}>
                  <div style={{ flex: '0 0 200px', fontSize: 11, color: theme.textTertiary, lineHeight: 1.4 }}>
                    {desc}
                  </div>
                  <div style={{ flex: 1 }} />
                  {sources && sources.length > 0 && (
                    <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                      {sources.join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Pending domains */}
          {pendingDomains.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {pendingDomains.map(d => {
                const slug = DOMAIN_SLUGS[d.domain]
                return (
                  <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.surfaceBorder}`, opacity: 0.5 }}>
                    <Link href={`/glossary/${slug}`} style={{
                      flex: '0 0 200px', fontSize: 14, fontWeight: 500, color: theme.textTertiary, textDecoration: 'none',
                    }}>
                      {DOMAIN_LABELS[d.domain] || d.domain}
                    </Link>
                    <div style={{ flex: 1, fontSize: 12, color: theme.textTertiary, fontStyle: 'italic' }}>
                      Awaiting data source
                    </div>
                    <div style={{ flex: '0 0 45px', fontFamily: theme.fontMono, fontSize: 15, color: theme.textTertiary, textAlign: 'right' }}>—</div>
                    <div style={{ flex: '0 0 45px', fontSize: 11, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Raw Data Points */}
        {rawPoints.length > 0 && (
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>
              Raw Indicators ({rawPoints.length} data points)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {rawPoints.map((p, i) => {
                const stressColor = getScoreColor(p.normalized)
                return (
                  <div key={i} style={{ padding: 14, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 6, lineHeight: 1.3 }}>
                      {p.indicator || p.series}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 22, fontWeight: 300, color: theme.isDark ? '#fff' : theme.text, fontFamily: theme.fontMono }}>
                        {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: stressColor, fontFamily: theme.fontMono }}>
                        {p.normalized}/100
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                      <span>{p.source}</span>
                      <span>{p.period}</span>
                    </div>
                    {/* Mini stress bar */}
                    <div style={{ marginTop: 6, height: 3, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 2 }}>
                      <div style={{ width: `${p.normalized}%`, height: '100%', background: stressColor, borderRadius: 2 }} />
                    </div>
                    {p.context && (
                      <div style={{ fontSize: 9, color: theme.textTertiary, marginTop: 6, lineHeight: 1.3 }}>
                        {p.context}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Data Sources Status */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
            Data Sources
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {dataSources.map(s => (
              <span key={s} style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 12, fontFamily: theme.fontMono,
                background: `${theme.accent}15`, border: `1px solid ${theme.accent}30`, color: theme.accent,
              }}>
                ● {s}
              </span>
            ))}
            {missingSourcesList.map(s => (
              <span key={s} style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 12, fontFamily: theme.fontMono,
                background: theme.surfaceBorder, color: theme.textTertiary,
              }}>
                ○ {s}
              </span>
            ))}
          </div>
          {errors.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 11, color: '#f59e0b', cursor: 'pointer', fontFamily: theme.fontMono }}>
                {errors.length} error{errors.length > 1 ? 's' : ''} during fetch
              </summary>
              <div style={{ marginTop: 8, fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, whiteSpace: 'pre-wrap' }}>
                {errors.join('\n')}
              </div>
            </details>
          )}
        </div>

        {/* Methodology & Explore */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Link href="/methodology" style={{
            background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12,
            padding: 20, textDecoration: 'none', display: 'block',
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>
              Methodology
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 6 }}>
              How We Calculate the Index
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
              Seven domains, weighted by systemic importance, normalized from authoritative data sources.
            </div>
          </Link>
          <Link href="/glossary" style={{
            background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12,
            padding: 20, textDecoration: 'none', display: 'block',
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>
              Domain Glossary
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 6 }}>
              Understand Every Domain
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
              What each domain measures, why it matters, data sources, FAQ, and actionable insights.
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-hero { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
