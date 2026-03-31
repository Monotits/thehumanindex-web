'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, DOMAIN_LABELS, DOMAIN_ICONS, BAND_LABELS } from '@/lib/types'
import { useTheme } from '@/lib/theme'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

interface Props {
  score: CompositeScore
  pulse: Commentary
}

const DOMAIN_TAGLINES: Record<string, string> = {
  work_risk: 'Machines are learning your job faster than policy can respond',
  inequality: 'The gap between top earners and median income widens',
  sentiment: 'Fear and uncertainty about AI rising in public discourse',
  policy: 'Governments move slower than the technology they regulate',
  unrest: 'Economic anxiety translating into social tension',
  decay: 'Trust in institutions eroding under political dysfunction',
  wellbeing: 'Health and stability metrics showing some resilience',
}

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
  const radius = 120
  const circumference = Math.PI * radius
  const progress = (animated / 100) * circumference

  return (
    <div style={{ position: 'relative', width: 280, height: 180, margin: '0 auto' }}>
      <svg viewBox="0 0 280 160" style={{ width: '100%', height: '100%' }}>
        <path d="M 20 150 A 120 120 0 0 1 260 150" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
        <path d="M 20 150 A 120 120 0 0 1 80 32" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" opacity="0.12" />
        <path d="M 80 32 A 120 120 0 0 1 140 8" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" opacity="0.12" />
        <path d="M 140 8 A 120 120 0 0 1 200 32" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" opacity="0.12" />
        <path d="M 200 32 A 120 120 0 0 1 260 150" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.12" />
        <path d="M 20 150 A 120 120 0 0 1 260 150" fill="none" stroke={bandColor} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`} style={{ transition: 'stroke-dasharray 0.5s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 200, color: '#fff', lineHeight: 1 }}>{animated.toFixed(animated === score ? 1 : 0)}</div>
      </div>
    </div>
  )
}

export default function HomeSignal({ score, pulse }: Props) {
  const { theme } = useTheme()

  const trendData = [
    { m: 'Oct', s: Math.max(30, score.score_value - 5.5) },
    { m: 'Nov', s: Math.max(30, score.score_value - 3.9) },
    { m: 'Dec', s: Math.max(30, score.score_value - 3.4) },
    { m: 'Jan', s: Math.max(30, score.score_value - 1.8) },
    { m: 'Feb', s: Math.max(30, score.score_value - 1.1) },
    { m: 'Mar', s: score.score_value },
  ]

  const sortedDomains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)

  const DOMAIN_COLORS: Record<string, string> = {
    work_risk: '#ef4444',
    inequality: '#f97316',
    sentiment: '#f59e0b',
    policy: '#eab308',
    unrest: '#3b82f6',
    decay: '#6366f1',
    wellbeing: '#22c55e',
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: theme.fontBody }}>
      {/* Hero */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 24 }}>
          Civilizational Stress Index — {new Date(score.computed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <GaugeVisual score={score.score_value} band={score.band} />

        <div style={{ display: 'inline-block', marginTop: 16, padding: '6px 20px', borderRadius: 20, background: `${theme.accent}15`, border: `1px solid ${theme.accent}30` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.accent, letterSpacing: 1 }}>
            {BAND_LABELS[score.band] || score.band.toUpperCase()}
          </span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 300, color: '#fff', lineHeight: 1.4, margin: '32px auto 16px', maxWidth: 600 }}>
          How close are we to the point of no return?
        </h1>
        <p style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>
          The Human Index tracks seven dimensions of civilizational stress caused by AI-driven economic transformation. Updated weekly with real data.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/quiz" style={{ padding: '12px 28px', fontSize: 14, background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
            How exposed is your job? →
          </Link>
          <Link href={`/pulse/${pulse.slug}`} style={{ padding: '12px 28px', fontSize: 14, background: 'transparent', border: '1px solid #333', borderRadius: 8, color: '#999', textDecoration: 'none' }}>
            Read this week&apos;s analysis
          </Link>
        </div>
      </section>

      {/* Trend */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>The trend is rising</h3>
              <p style={{ fontSize: 12, color: theme.textTertiary, margin: '4px 0 0' }}>Composite index, last 6 months</p>
            </div>
            <div style={{ fontSize: 13, color: theme.accent, fontWeight: 600 }}>↑ {((score.score_value / (score.score_value - 5.5) - 1) * 100).toFixed(1)}% since October</div>
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

      {/* 7 Domains */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 24px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>Seven Signals We Track</h2>
          <p style={{ fontSize: 14, color: theme.textTertiary, margin: 0 }}>Each scored 0-100 from public data. Higher = more stress.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {sortedDomains.map(d => {
            const color = DOMAIN_COLORS[d.domain] || '#888'
            return (
              <div key={d.domain} style={{ background: theme.surface, borderRadius: 12, padding: 24, border: `1px solid ${theme.surfaceBorder}`, transition: 'transform 0.2s, border-color 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = `${color}44` }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = theme.surfaceBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{DOMAIN_ICONS[d.domain] || '📈'}</span>
                  <span style={{ fontSize: 28, fontWeight: 700, color }}>{d.value.toFixed(0)}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>{DOMAIN_LABELS[d.domain] || d.domain}</h3>
                <p style={{ fontSize: 12, color: theme.textTertiary, lineHeight: 1.5, margin: 0 }}>{DOMAIN_TAGLINES[d.domain] || ''}</p>
                <div style={{ width: '100%', height: 3, background: '#1a1a1a', borderRadius: 2, marginTop: 16 }}>
                  <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pulse */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ borderTop: `1px solid ${theme.surfaceBorder}`, paddingTop: 40 }}>
          <div style={{ fontSize: 11, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>This Week&apos;s Pulse</div>
          <h2 style={{ fontSize: 28, fontWeight: 300, color: '#fff', lineHeight: 1.3, margin: '0 0 16px' }}>{pulse.title}</h2>
          <p style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.8, margin: '0 0 24px' }}>
            {pulse.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 300)}...
          </p>
          <Link href={`/pulse/${pulse.slug}`} style={{ fontSize: 14, color: '#fff', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid #333', paddingBottom: 2 }}>
            Read the full analysis →
          </Link>
        </div>
      </section>

      {/* Quiz CTA */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 60px' }}>
        <div style={{ background: 'linear-gradient(135deg, #111, #1a1a2a)', border: '1px solid #222', borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 300, color: '#fff', margin: '0 0 12px' }}>How exposed is your job?</h2>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: '0 auto 28px', maxWidth: 480 }}>
            Take a 2-minute assessment to see where you stand in the AI transformation landscape.
          </p>
          <Link href="/quiz" style={{ display: 'inline-block', padding: '14px 36px', fontSize: 15, background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
            Take the Quiz →
          </Link>
        </div>
      </section>
    </div>
  )
}
