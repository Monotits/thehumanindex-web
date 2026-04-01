'use client'

import { useEffect, useState } from 'react'
import { CompositeScore, DOMAIN_LABELS, Domain } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

const DOMAIN_WEIGHTS: Record<string, number> = {
  work_risk: 0.25,
  inequality: 0.18,
  unrest: 0.15,
  decay: 0.12,
  wellbeing: 0.12,
  policy: 0.10,
  sentiment: 0.08,
}

export default function DashboardPage() {
  const [score, setScore] = useState<CompositeScore | null>(null)
  const [historicalData, setHistoricalData] = useState<{ date: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSources, setDataSources] = useState<string[]>([])
  const [rawPoints, setRawPoints] = useState<RealDataResponse['raw_points']>([])
  const { theme } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try Supabase
        let gotFromSupabase = false
        try {
          const { data: scores, error } = await supabase
            .from('composite_scores')
            .select('*, sub_indexes(*)')
            .eq('score_type', 'composite')
            .order('computed_at', { ascending: false })
            .limit(1)

          if (!error && scores && scores.length > 0) {
            setScore(scores[0] as CompositeScore)
            gotFromSupabase = true
          }

          const { data: history, error: histError } = await supabase
            .from('composite_scores')
            .select('score_value, computed_at')
            .eq('score_type', 'composite')
            .order('computed_at', { ascending: true })
            .limit(20)

          if (!histError && history && history.length > 0) {
            setHistoricalData(history.map((h: { computed_at: string; score_value: number }) => ({
              date: new Date(h.computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: h.score_value,
            })))
          }
        } catch (e) {
          console.error('Supabase failed:', e)
        }

        // 2. Try real data API
        if (!gotFromSupabase) {
          try {
            const res = await fetch('/api/data')
            if (res.ok) {
              const data: RealDataResponse = await res.json()
              if (data.scores) {
                const realScore: CompositeScore = {
                  id: `real-${Date.now()}`,
                  score_type: 'composite',
                  score_value: data.scores.composite,
                  band: data.scores.band as CompositeScore['band'],
                  delta: null,
                  computed_at: data.fetched_at,
                  metadata: {
                    sources_connected: data.scores.sources_connected,
                    sources_missing: data.scores.sources_missing,
                  },
                  sub_indexes: Object.entries(data.scores.domains).map(([domain, info]) => ({
                    id: `real-sub-${domain}`,
                    composite_score_id: `real-${Date.now()}`,
                    domain: domain as Domain,
                    value: info.score ?? 0,
                    weight: DOMAIN_WEIGHTS[domain] || 0.1,
                    source_updated_at: data.fetched_at,
                    raw_data: { sources: info.sources },
                  })),
                }
                setScore(realScore)
                setDataSources(data.scores.sources_connected)
                setRawPoints(data.raw_points)
              }
            }
          } catch (e) {
            console.error('Real data API failed:', e)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !score) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.textTertiary }}>Connecting to data sources...</div>
      </div>
    )
  }

  const sortedDomains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px' }}>Dashboard</h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0 }}>
            Real-time monitoring — Last updated: {formatDate(score.computed_at)}
          </p>
        </div>

        {/* Score + Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 32 }}>
          {/* Big Number */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Composite</div>
            <div style={{ fontSize: 56, fontWeight: 200, color: theme.isDark ? '#fff' : theme.text, lineHeight: 1 }}>{score.score_value.toFixed(2)}</div>
            {score.delta !== null && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: score.delta > 0 ? theme.accent : '#22c55e' }}>
                  {score.delta > 0 ? '▲' : '▼'} {Math.abs(score.delta).toFixed(2)}
                </span>
                <span style={{ fontSize: 12, color: theme.textTertiary, marginLeft: 6 }}>WoW</span>
              </div>
            )}
          </div>

          {/* Chart */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Historical Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData.length > 0 ? historicalData : [
                { date: formatDate(score.computed_at), score: score.score_value },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.surfaceBorder} />
                <XAxis dataKey="date" tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke={theme.surfaceBorder} />
                <YAxis domain={[0, 100]} tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke={theme.surfaceBorder} />
                <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke={theme.accent} strokeWidth={2} dot={{ fill: theme.accent, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Domain Breakdown */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Domain Breakdown</div>
          {sortedDomains.map(d => {
            const hasData = d.raw_data && (d.raw_data as Record<string, unknown>).hasData !== false
            const color = !hasData ? theme.textTertiary : d.value >= 65 ? '#ef4444' : d.value >= 45 ? '#f59e0b' : d.value >= 25 ? '#3b82f6' : '#22c55e'
            const sources = d.raw_data && (d.raw_data as Record<string, string[]>).sources
              ? (d.raw_data as Record<string, string[]>).sources
              : null
            return (
              <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.surfaceBorder}`, opacity: hasData ? 1 : 0.5 }}>
                <div style={{ flex: '0 0 180px', fontSize: 14, fontWeight: 500, color: theme.isDark ? '#fff' : theme.text }}>
                  {DOMAIN_LABELS[d.domain] || d.domain}
                </div>
                {hasData ? (
                  <>
                    <div style={{ flex: 1, height: 8, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 4, marginRight: 16 }}>
                      <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ flex: '0 0 50px', fontFamily: theme.fontMono, fontSize: 15, fontWeight: 600, color, textAlign: 'right' }}>{d.value.toFixed(1)}</div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, fontSize: 12, color: theme.textTertiary, fontStyle: 'italic', marginRight: 16 }}>
                      Awaiting data source
                    </div>
                    <div style={{ flex: '0 0 50px', fontFamily: theme.fontMono, fontSize: 15, color: theme.textTertiary, textAlign: 'right' }}>—</div>
                  </>
                )}
                <div style={{ flex: '0 0 50px', fontSize: 12, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                {sources && sources.length > 0 && (
                  <div style={{ flex: '0 0 100px', fontSize: 10, color: theme.textTertiary, textAlign: 'right', fontFamily: theme.fontMono }}>
                    {sources.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Raw Data Points */}
        {rawPoints.length > 0 && (
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Raw Data Points</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {rawPoints.map((p, i) => {
                const stressColor = p.normalized >= 65 ? '#ef4444' : p.normalized >= 45 ? '#f59e0b' : p.normalized >= 25 ? '#3b82f6' : '#22c55e'
                return (
                  <div key={i} style={{ padding: 12, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginBottom: 4 }}>{p.indicator || p.series}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 20, fontWeight: 300, color: theme.accent, fontFamily: theme.fontMono }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: stressColor, fontFamily: theme.fontMono }}>{p.normalized}/100</span>
                    </div>
                    <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 4, fontFamily: theme.fontMono }}>
                      {p.source} · {p.period}
                    </div>
                    {p.context && (
                      <div style={{ fontSize: 9, color: theme.textTertiary, marginTop: 4, opacity: 0.7 }}>
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
        {dataSources.length > 0 && (
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>Data Sources</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {dataSources.map(s => (
                <span key={s} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: `${theme.accent}15`, border: `1px solid ${theme.accent}30`, color: theme.accent, fontFamily: theme.fontMono }}>
                  {s}
                </span>
              ))}
              {score.metadata && (score.metadata as Record<string, string[]>).sources_missing?.map((s: string) => (
                <span key={s} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: `${theme.surfaceBorder}`, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                  {s} (pending)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
