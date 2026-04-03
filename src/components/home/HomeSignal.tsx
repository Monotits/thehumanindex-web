'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, Domain, DOMAIN_LABELS, BAND_LABELS } from '@/lib/types'
import { KeyStat } from '@/lib/realData'
import { useTheme } from '@/lib/theme'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'
import { ShareButton } from '@/components/share'
import type { CompositeCardData } from '@/components/share'
import SubscribeForm from '@/components/SubscribeForm'
import { MonthlyScore } from '@/lib/historicalData'

interface Props {
  score: CompositeScore
  pulse: Commentary
  keyStat?: KeyStat
  trendHistory?: MonthlyScore[]
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildTrendData(history: MonthlyScore[] | undefined, currentScore: number) {
  if (history && history.length > 0) {
    const data = history.map(h => {
      const [, monthStr] = h.year_month.split('-')
      return { m: MONTH_SHORT[parseInt(monthStr, 10) - 1], s: h.composite }
    })
    const now = new Date()
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    if (history[history.length - 1]?.year_month !== currentYM) {
      data.push({ m: MONTH_SHORT[now.getMonth()], s: currentScore })
    }
    return data
  }
  const now = new Date()
  const months: { m: string; s: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ m: MONTH_SHORT[d.getMonth()], s: currentScore })
  }
  return months
}

/* ─── Gauge ─── */
function GaugeVisual({ score, band }: { score: number; band: string }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    let current = 0
    const t = setInterval(() => {
      current += 0.8
      if (current >= score) { clearInterval(t); setAnimated(score) }
      else setAnimated(current)
    }, 15)
    return () => clearInterval(t)
  }, [score])

  const bandColor = band === 'critical' ? '#ef4444' : band === 'high' ? '#f97316' : band === 'elevated' ? '#f59e0b' : band === 'moderate' ? '#3b82f6' : '#22c55e'
  const circumference = Math.PI * 120
  const progress = (animated / 100) * circumference

  const cx = 140, cy = 150, r = 120
  const p = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy - r * Math.sin(rad)).toFixed(2)}`
  }

  return (
    <div style={{ position: 'relative', width: 300, height: 200, margin: '0 auto' }}>
      <svg viewBox="0 0 280 170" style={{ width: '100%', height: '100%' }}>
        <path d={`M ${p(180)} A ${r} ${r} 0 0 1 ${p(0)}`} fill="none" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" />
        <path d={`M ${p(180)} A ${r} ${r} 0 0 1 ${p(135)}`} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
        <path d={`M ${p(135)} A ${r} ${r} 0 0 1 ${p(90)}`} fill="none" stroke="#3b82f6" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
        <path d={`M ${p(90)} A ${r} ${r} 0 0 1 ${p(45)}`} fill="none" stroke="#f59e0b" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
        <path d={`M ${p(45)} A ${r} ${r} 0 0 1 ${p(0)}`} fill="none" stroke="#ef4444" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
        <path d={`M ${p(180)} A ${r} ${r} 0 0 1 ${p(0)}`} fill="none" stroke={bandColor} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`} style={{ transition: 'stroke-dasharray 0.5s ease-out' }} />
        {[135, 90, 45].map(deg => {
          const rad = (deg * Math.PI) / 180
          const x = cx + r * Math.cos(rad)
          const y = cy - r * Math.sin(rad)
          return <circle key={deg} cx={x} cy={y} r="3" fill="#333" />
        })}
      </svg>
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 200, color: '#fff', lineHeight: 1 }}>{animated.toFixed(animated === score ? 1 : 0)}</div>
      </div>
    </div>
  )
}

export default function HomeSignal({ score, pulse, keyStat, trendHistory }: Props) {
  const { theme } = useTheme()

  const trendData = buildTrendData(trendHistory, score.score_value)
  const sortedDomains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)
  const stat = keyStat || { value: '—', label: 'connecting to data sources...', source: '' }

  const compositeShareData: CompositeCardData = {
    type: 'composite',
    score: score.score_value,
    delta: score.delta,
    domains: sortedDomains.map(d => ({ domain: d.domain as Domain, score: Math.round(d.value) })),
    date: new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: theme.fontBody }}>

      {/* ═══ Hero ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 24 }}>
          Civilizational Stress Index — {new Date(score.computed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <GaugeVisual score={score.score_value} band={score.band} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <div style={{ padding: '6px 20px', borderRadius: 20, background: `${theme.accent}15`, border: `1px solid ${theme.accent}30` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.accent, letterSpacing: 1 }}>
              {BAND_LABELS[score.band] || score.band.toUpperCase()}
            </span>
          </div>
          <ShareButton data={compositeShareData} variant="compact" label="Share" />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 300, color: '#fff', lineHeight: 1.4, margin: '32px auto 16px', maxWidth: 600 }}>
          How close are we to the point of no return?
        </h1>
        <p style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>
          The Human Index tracks seven dimensions of civilizational stress caused by AI-driven economic transformation. Updated weekly with real data.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ padding: '12px 28px', fontSize: 14, background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
            Explore the Dashboard →
          </Link>
          <Link href="/quiz" style={{ padding: '12px 28px', fontSize: 14, background: 'transparent', border: '1px solid #333', borderRadius: 8, color: '#999', textDecoration: 'none' }}>
            How exposed is your job?
          </Link>
        </div>
      </section>

      {/* ═══ Compact Stat Bar ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div className="stat-bar" style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0,
          background: theme.surface, borderRadius: 10, border: `1px solid ${theme.surfaceBorder}`,
          overflow: 'hidden',
        }}>
          {[
            { value: stat.value, label: stat.label.replace('initial ', '').replace(' this week', '') },
            ...(score.sub_indexes?.slice(0, 2).map(s => ({
              value: s.value.toFixed(1),
              label: (DOMAIN_LABELS[s.domain] || s.domain).replace(/_/g, ' '),
            })) || []),
          ].map((item, i, arr) => (
            <div key={i} style={{
              flex: '1 1 0', padding: '14px 20px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${theme.surfaceBorder}` : 'none',
              minWidth: 0,
            }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', fontFamily: theme.fontMono, lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Trend Chart ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>6-Month Trend</h3>
              <p style={{ fontSize: 12, color: theme.textTertiary, margin: '4px 0 0' }}>Composite index over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="signalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.accent} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fill: theme.textTertiary, fontSize: 11 }} stroke="transparent" />
              <YAxis domain={[30, 60]} hide />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="s" stroke={theme.accent} strokeWidth={2} fill="url(#signalGrad)" dot={{ r: 3, fill: theme.accent }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ═══ Domain Overview (simple bars) ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>Seven Signals We Track</h2>
          <p style={{ fontSize: 14, color: theme.textTertiary, margin: 0 }}>Each scored 0-100 from public data. Higher = more stress.</p>
        </div>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 24 }}>
          {sortedDomains.map(d => {
            const color = d.value >= 70 ? '#ef4444' : d.value >= 55 ? '#f97316' : d.value >= 40 ? '#f59e0b' : d.value >= 25 ? '#3b82f6' : '#22c55e'
            return (
              <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <div style={{ flex: '0 0 160px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {DOMAIN_LABELS[d.domain] || d.domain}
                </div>
                <div style={{ flex: 1, height: 6, background: '#1a1a1a', borderRadius: 3, marginRight: 12 }}>
                  <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ flex: '0 0 40px', fontFamily: theme.fontMono, fontSize: 14, fontWeight: 600, color, textAlign: 'right' }}>
                  {d.value.toFixed(0)}
                </div>
              </div>
            )
          })}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: theme.accent, textDecoration: 'none' }}>
              Full domain analysis on Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Latest Pulse (Prominent) ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0f1419, #1a1a2a)', borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 32 }}>
          <div style={{ fontSize: 11, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>This Week&apos;s Pulse</div>
          <h2 style={{ fontSize: 26, fontWeight: 300, color: '#fff', lineHeight: 1.3, margin: '0 0 16px' }}>{pulse.title}</h2>
          <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.8, margin: '0 0 24px' }}>
            {pulse.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 300)}...
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href={`/pulse/${pulse.slug}`} style={{ fontSize: 14, color: '#fff', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid #444', paddingBottom: 2 }}>
              Read the full analysis →
            </Link>
            <Link href="/pulse" style={{ fontSize: 13, color: theme.textTertiary, textDecoration: 'none' }}>
              View all Pulse reports
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Quiz CTA + Subscribe ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="grid-2col">
          {/* Quiz CTA */}
          <div style={{ background: 'linear-gradient(135deg, #111, #1a1a2a)', border: '1px solid #222', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>How exposed is your job?</h3>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 20px' }}>
              Take a 2-minute assessment to see where you stand in the AI displacement landscape.
            </p>
            <Link href="/quiz" style={{ display: 'inline-block', padding: '12px 28px', fontSize: 14, background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
              Take the Quiz →
            </Link>
          </div>

          {/* Subscribe */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 300, color: '#fff', marginBottom: 8 }}>Stay informed. Every week.</div>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 20px' }}>
              Composite score, top movers, and analysis — delivered every Monday.
            </p>
            <div style={{ maxWidth: 340, margin: '0 auto' }}>
              <SubscribeForm />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Methodology Brief ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 300, color: '#fff', margin: '0 0 4px' }}>How the Index Works</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }} className="grid-methodology">
            {[
              { num: '01', title: 'Collect', desc: '10+ live sources: BLS, FRED, World Bank, OECD, WHO, V-Dem, O*NET, AI Index' },
              { num: '02', title: 'Analyze', desc: 'Weighted scoring with anomaly detection across 7 domains' },
              { num: '03', title: 'Index', desc: 'Weekly composite score with AI-generated analysis' },
            ].map((step) => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 200, color: theme.accent, opacity: 0.5, marginBottom: 8 }}>{step.num}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: theme.textTertiary, lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/methodology" style={{ fontSize: 12, color: theme.accent, textDecoration: 'none' }}>Read full methodology →</Link>
          </div>
        </div>
      </section>

      {/* ═══ Audience Positioning ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1, marginBottom: 16 }}>BUILT FOR</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {['Researchers', 'Policy Analysts', 'Journalists', 'Macro Strategists', 'Everyone'].map(a => (
            <span key={a} style={{ fontSize: 13, color: theme.textSecondary, padding: '6px 16px', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 20 }}>{a}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
