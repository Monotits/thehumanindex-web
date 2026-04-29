'use client'

import { useEffect, useState } from 'react'
import { CompositeScore, DOMAIN_LABELS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import CorrelationHeatmap from '@/components/charts/CorrelationHeatmap'
import WaterfallChart from '@/components/charts/WaterfallChart'
import RiskBubbleChart from '@/components/charts/RiskBubbleChart'
import MultiDomainTrend from '@/components/charts/MultiDomainTrend'
import StackedAreaDecomposition from '@/components/charts/StackedAreaDecomposition'
import WeeklyHeatmap from '@/components/charts/WeeklyHeatmap'
import CorrelationInsightsPanel from '@/components/CorrelationInsights'
import { generateCorrelationInsights, CorrelationInsight } from '@/lib/correlationInsights'
import { ShareButton } from '@/components/share'
import type { CompositeCardData, DomainCardData, DashboardCardData } from '@/components/share'
import { Domain } from '@/lib/types'

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

interface MonthlyDomainRecord {
  year_month: string
  composite: number
  work_risk: number | null
  inequality: number | null
  unrest: number | null
  decay: number | null
  wellbeing: number | null
  policy: number | null
  sentiment: number | null
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

function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 55) return '#f97316'
  if (score >= 40) return '#f59e0b'
  if (score >= 25) return '#3b82f6'
  return '#22c55e'
}

function getBandColor(band: string): string {
  switch (band) {
    case 'critical': return '#ef4444'
    case 'high': return '#f97316'
    case 'elevated': return '#f59e0b'
    case 'moderate': return '#3b82f6'
    case 'low': return '#22c55e'
    default: return '#888'
  }
}

export default function DashboardPage() {
  const [score, setScore] = useState<CompositeScore | null>(null)
  const [historicalData, setHistoricalData] = useState<{ date: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSources, setDataSources] = useState<string[]>([])
  const [missingSourcesList, setMissingSources] = useState<string[]>([])
  const [rawPoints, setRawPoints] = useState<RealDataResponse['raw_points']>([])
  const [errors, setErrors] = useState<string[]>([])
  const [correlationInsights, setCorrelationInsights] = useState<CorrelationInsight[]>([])
  const [monthlyDomainHistory, setMonthlyDomainHistory] = useState<MonthlyDomainRecord[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
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
            const meta = s.metadata as Record<string, unknown> | null
            if (meta?.sources_connected) setDataSources(meta.sources_connected as string[])
            if (meta?.sources_missing) setMissingSources(meta.sources_missing as string[])
            if (meta?.errors) setErrors(meta.errors as string[])

            const points: RealDataResponse['raw_points'] = []
            for (const sub of s.sub_indexes || []) {
              const rd = sub.raw_data as Record<string, unknown> | null
              if (rd?.dataPoints && Array.isArray(rd.dataPoints)) {
                for (const dp of rd.dataPoints) {
                  points.push(dp as RealDataResponse['raw_points'][0])
                }
              }
            }
            if (points.length > 0) {
              setRawPoints(points)
              // Generate cross-domain correlation insights from raw data
              const insightInputs = points.map(p => ({
                domain: p.domain,
                indicator: p.indicator || p.series,
                value: p.value,
                normalized: p.normalized,
              }))
              setCorrelationInsights(generateCorrelationInsights(insightInputs))
            }
          }
        } catch {
          // Supabase not available
        }

        try {
          const { data: history, error: histError } = await supabase
            .from('monthly_scores')
            .select('year_month, composite, work_risk, inequality, unrest, decay, wellbeing, policy, sentiment')
            .order('year_month', { ascending: true })
            .limit(12)

          if (!histError && history && history.length > 0) {
            const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            setHistoricalData(history.map((h: { year_month: string; composite: number }) => {
              const [, monthStr] = h.year_month.split('-')
              return { date: MONTH_SHORT[parseInt(monthStr, 10) - 1], score: Number(h.composite) }
            }))
            setMonthlyDomainHistory(history as MonthlyDomainRecord[])
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
  const bandColor = hasScore ? getBandColor(score!.band) : theme.textTertiary
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
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0 }}>
              Real-time civilizational stress monitoring — charts, analysis, and live data feeds
              {hasScore && <> — Updated {formatDate(score!.computed_at)}</>}
            </p>
          </div>
          {hasScore && (
            <ShareButton
              data={{
                type: 'dashboard',
                compositeScore: score!.score_value,
                band: score!.band,
                delta: score!.delta,
                activeDomains: activeDomains.length,
                totalDomains: sortedDomains.length,
                domains: sortedDomains.map(d => ({ domain: d.domain as Domain, score: Math.round(d.value) })),
                connectedSources: dataSources,
                totalSources: dataSources.length + missingSourcesList.length,
                indicatorCount: rawPoints.length,
                trend: historicalData.map(h => ({ label: h.date, score: h.score })),
                topInsight: correlationInsights.length > 0 ? correlationInsights[0].commentary : null,
                date: new Date(score!.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              } as DashboardCardData}
              variant="button"
              label="Share Dashboard"
            />
          )}
        </div>

        {/* No data state */}
        {!hasScore && (
          <div style={{
            background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10,
            padding: 32, marginBottom: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 12 }}>
              Waiting for Data Sources
            </div>
            <p style={{ fontSize: 14, color: theme.textSecondary, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
              The index is computed from live data feeds. Data sources connect automatically — scores will appear once feeds are active.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {['FRED', 'World Bank', 'BLS', 'OECD', 'WHO', 'O*NET'].map(s => {
                const connected = dataSources.includes(s)
                return (
                  <span key={s} style={{
                    fontSize: 11, padding: '4px 12px', borderRadius: 10, fontFamily: theme.fontMono,
                    background: connected ? `${theme.accent}15` : `${theme.surfaceBorder}`,
                    border: `1px solid ${connected ? theme.accent + '30' : theme.surfaceBorder}`,
                    color: connected ? theme.accent : theme.textTertiary,
                  }}>
                    {connected ? '●' : '○'} {s}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Score + Historical Chart */}
        {hasScore && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Composite Index</div>
              <div style={{ fontSize: 48, fontWeight: 200, color: bandColor, lineHeight: 1, fontFamily: theme.fontMono }}>
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
              {(() => {
                const meta = (score!.metadata as Record<string, unknown> | null) || {}
                const sourcesOk = typeof meta.sources_ok === 'number' ? meta.sources_ok : null
                const sourcesTotal = typeof meta.sources_total === 'number' ? meta.sources_total : null
                const confidence = typeof meta.confidence === 'number' ? meta.confidence : null
                if (sourcesOk === null || sourcesTotal === null) return null
                const conf = confidence ?? sourcesOk / Math.max(sourcesTotal, 1)
                const confColor = conf >= 0.85 ? '#22c55e' : conf >= 0.6 ? '#f59e0b' : '#ef4444'
                return (
                  <Link href="/data-sources" style={{ textDecoration: 'none' }}>
                    <div
                      title="View source-level health"
                      style={{
                        marginTop: 8,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: `${confColor}1a`,
                        border: `1px solid ${confColor}40`,
                        fontSize: 10,
                        color: confColor,
                        fontFamily: theme.fontMono,
                        letterSpacing: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: confColor }} />
                      CONFIDENCE {sourcesOk}/{sourcesTotal} · {Math.round(conf * 100)}%
                    </div>
                  </Link>
                )
              })()}
              <div style={{ marginTop: 12 }}>
                <ShareButton
                  data={{
                    type: 'composite',
                    score: score!.score_value,
                    delta: score!.delta,
                    domains: sortedDomains.map(d => ({ domain: d.domain as Domain, score: Math.round(d.value) })),
                    date: new Date(score!.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                  } as CompositeCardData}
                  variant="compact"
                  label="Share"
                />
              </div>
            </div>

            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24 }}>
              {(() => {
                const MONTH_SHORT_DASH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                const totalMonths = 6
                const now = new Date()

                // Build month labels
                const monthLabels: string[] = []
                for (let i = totalMonths - 1; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                  monthLabels.push(MONTH_SHORT_DASH[d.getMonth()])
                }

                const realPoints = historicalData.length > 0 ? historicalData : [{ date: MONTH_SHORT_DASH[now.getMonth()], score: score!.score_value }]
                const hasEnough = realPoints.length >= totalMonths

                let chartData: { date: string; real?: number; projected?: number }[]
                if (hasEnough) {
                  chartData = realPoints.slice(-totalMonths).map(d => ({ date: d.date, real: d.score }))
                } else {
                  const projectedCount = totalMonths - realPoints.length
                  const firstReal = realPoints[0]?.score ?? score!.score_value
                  chartData = []
                  for (let i = 0; i < projectedCount; i++) {
                    const dist = projectedCount - i
                    const s = firstReal - dist * (0.8 + Math.sin(i * 1.3) * 0.4)
                    chartData.push({ date: monthLabels[i], projected: Math.max(10, Math.min(95, s)) })
                  }
                  // Bridge point: last projected also gets real value so lines connect
                  if (chartData.length > 0 && realPoints.length > 0) {
                    chartData[chartData.length - 1].real = chartData[chartData.length - 1].projected
                  }
                  for (const rp of realPoints) {
                    chartData.push({ date: rp.date, real: rp.score })
                  }
                }

                const hasProjected = chartData.some(d => d.projected !== undefined)

                return (
                  <>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>
                      {historicalData.length > 1 ? 'Historical Trend' : 'Current Reading'}
                      {hasProjected && <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 9, letterSpacing: 1 }}>(dashed = projected)</span>}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.surfaceBorder} />
                        <XAxis dataKey="date" tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke={theme.surfaceBorder} />
                        <YAxis domain={[20, 70]} tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke={theme.surfaceBorder} />
                        <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, fontSize: 12 }} />
                        {hasProjected && (
                          <Line type="monotone" dataKey="projected" stroke={bandColor} strokeWidth={1.5} strokeDasharray="5 5" strokeOpacity={0.4} dot={false} connectNulls={false} />
                        )}
                        <Line type="monotone" dataKey="real" stroke={bandColor} strokeWidth={2} dot={{ fill: bandColor, r: 3 }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Domain Breakdown */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase' }}>Domain Breakdown</div>
            <Link href="/glossary" style={{ fontSize: 12, color: theme.accent, textDecoration: 'none' }}>Learn about each domain →</Link>
          </div>
          {activeDomains.map(d => {
            const color = getScoreColor(d.value)
            const slug = DOMAIN_SLUGS[d.domain]
            const desc = DOMAIN_SHORT_DESC[d.domain]
            const sources = d.raw_data && (d.raw_data as Record<string, string[]>).sources ? (d.raw_data as Record<string, string[]>).sources : null
            return (
              <div key={d.domain} style={{ padding: '14px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <Link href={`/glossary/${slug}`} style={{ flex: '0 0 200px', fontSize: 14, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, textDecoration: 'none' }}>
                    {DOMAIN_LABELS[d.domain] || d.domain}
                  </Link>
                  <div style={{ flex: 1, height: 8, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 4, marginRight: 16 }}>
                    <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ flex: '0 0 45px', fontFamily: theme.fontMono, fontSize: 15, fontWeight: 600, color, textAlign: 'right' }}>{d.value.toFixed(0)}</div>
                  <div style={{ flex: '0 0 45px', fontSize: 11, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 0 }}>
                  <div style={{ flex: '0 0 200px', fontSize: 11, color: theme.textTertiary, lineHeight: 1.4 }}>{desc}</div>
                  <div style={{ flex: 1 }} />
                  {sources && sources.length > 0 && (
                    <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, marginRight: 8 }}>{sources.join(' · ')}</div>
                  )}
                  <ShareButton
                    data={{
                      type: 'domain',
                      domain: d.domain as Domain,
                      score: Math.round(d.value),
                      delta: null,
                      headline: desc || '',
                      date: new Date(score!.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    } as DomainCardData}
                    variant="compact"
                    label=""
                  />
                </div>
              </div>
            )
          })}
          {pendingDomains.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {pendingDomains.map(d => (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.surfaceBorder}`, opacity: 0.5 }}>
                  <Link href={`/glossary/${DOMAIN_SLUGS[d.domain]}`} style={{ flex: '0 0 200px', fontSize: 14, fontWeight: 500, color: theme.textTertiary, textDecoration: 'none' }}>
                    {DOMAIN_LABELS[d.domain] || d.domain}
                  </Link>
                  <div style={{ flex: 1, fontSize: 12, color: theme.textTertiary, fontStyle: 'italic' }}>Awaiting data source</div>
                  <div style={{ flex: '0 0 45px', fontFamily: theme.fontMono, fontSize: 15, color: theme.textTertiary, textAlign: 'right' }}>—</div>
                  <div style={{ flex: '0 0 45px', fontSize: 11, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ CORRELATION INSIGHTS ═══ */}
        {correlationInsights.length > 0 && (
          <CorrelationInsightsPanel insights={correlationInsights} />
        )}

        {/* ═══ ADVANCED CHARTS (moved from Home) ═══ */}
        {hasScore && sortedDomains.length > 0 && (
          <>
            {/* Stacked Area Decomposition */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
              <StackedAreaDecomposition domains={sortedDomains} monthlyHistory={monthlyDomainHistory} />
            </div>

            {/* Waterfall + Multi-Domain Trend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} className="grid-2col">
              <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24 }}>
                <WaterfallChart domains={sortedDomains} compositeScore={score!.score_value} />
              </div>
              <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24 }}>
                <MultiDomainTrend domains={sortedDomains} monthlyHistory={monthlyDomainHistory} />
              </div>
            </div>

            {/* Risk Matrix + Correlation + Heatmap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} className="grid-2col">
              <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24 }}>
                <RiskBubbleChart domains={sortedDomains} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24 }}>
                  <WeeklyHeatmap currentScore={score!.score_value} />
                </div>
                <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24 }}>
                  <CorrelationHeatmap domains={sortedDomains} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ Layoff Tracker CTA ═══ */}
        <Link href="/layoffs" style={{
          display: 'block', background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10,
          padding: 24, marginBottom: 24, textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 6 }}>Work Risk — Deep Dive</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 4 }}>Layoff Tracker</div>
              <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
                Corporate layoffs, WARN Act filings, and social signals — updated in real time.
              </div>
            </div>
            <div style={{ fontSize: 24, color: theme.textTertiary }}>→</div>
          </div>
        </Link>

        {/* Raw Data Points */}
        {rawPoints.length > 0 && (
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
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
                    <div style={{ marginTop: 6, height: 3, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 2 }}>
                      <div style={{ width: `${p.normalized}%`, height: '100%', background: stressColor, borderRadius: 2 }} />
                    </div>
                    {p.context && (
                      <div style={{ fontSize: 9, color: theme.textTertiary, marginTop: 6, lineHeight: 1.3 }}>{p.context}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Data Sources Status */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>Data Sources</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {dataSources.map(s => (
              <span key={s} style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 10, fontFamily: theme.fontMono,
                background: `${theme.accent}15`, border: `1px solid ${theme.accent}30`, color: theme.accent,
              }}>● {s}</span>
            ))}
            {missingSourcesList.map(s => (
              <span key={s} style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 10, fontFamily: theme.fontMono,
                background: theme.surfaceBorder, color: theme.textTertiary,
              }}>○ {s}</span>
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

        {/* Methodology & Glossary links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Link href="/methodology" style={{
            background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10,
            padding: 20, textDecoration: 'none', display: 'block',
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>Methodology</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 6 }}>How We Calculate the Index</div>
            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
              Seven domains, weighted by systemic importance, normalized from authoritative data sources.
            </div>
          </Link>
          <Link href="/glossary" style={{
            background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10,
            padding: 20, textDecoration: 'none', display: 'block',
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>Domain Glossary</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 6 }}>Understand Every Domain</div>
            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
              What each domain measures, why it matters, data sources, FAQ, and actionable insights.
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
