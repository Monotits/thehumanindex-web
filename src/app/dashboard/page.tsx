'use client'

import { useEffect, useState } from 'react'
import { CompositeScore, DOMAIN_LABELS } from '@/lib/types'
import { MOCK_COMPOSITE_SCORE } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [score, setScore] = useState<CompositeScore | null>(null)
  const [historicalData, setHistoricalData] = useState<{ date: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: scores, error } = await supabase
          .from('composite_scores')
          .select('*, sub_indexes(*)')
          .eq('score_type', 'composite')
          .order('computed_at', { ascending: false })
          .limit(1)

        if (error) throw error
        if (scores && scores.length > 0) setScore(scores[0] as CompositeScore)
        else setScore(MOCK_COMPOSITE_SCORE)

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
      } catch (error) {
        console.error('Failed to load score:', error)
        setScore(MOCK_COMPOSITE_SCORE)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !score) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.textTertiary }}>Loading...</div>
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
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: (score.delta || 0) > 0 ? theme.accent : '#22c55e' }}>
                {(score.delta || 0) > 0 ? '▲' : '▼'} {Math.abs(score.delta || 0).toFixed(2)}
              </span>
              <span style={{ fontSize: 12, color: theme.textTertiary, marginLeft: 6 }}>WoW</span>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Historical Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData.length > 0 ? historicalData : [{ date: 'Now', score: score.score_value }]}>
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
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Domain Breakdown</div>
          {sortedDomains.map(d => {
            const color = d.value >= 65 ? '#ef4444' : d.value >= 45 ? '#f59e0b' : d.value >= 25 ? '#3b82f6' : '#22c55e'
            return (
              <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <div style={{ flex: '0 0 180px', fontSize: 14, fontWeight: 500, color: theme.isDark ? '#fff' : theme.text }}>
                  {DOMAIN_LABELS[d.domain] || d.domain}
                </div>
                <div style={{ flex: 1, height: 8, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 4, marginRight: 16 }}>
                  <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 4 }} />
                </div>
                <div style={{ flex: '0 0 50px', fontFamily: theme.fontMono, fontSize: 15, fontWeight: 600, color, textAlign: 'right' }}>{d.value.toFixed(1)}</div>
                <div style={{ flex: '0 0 50px', fontSize: 12, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
