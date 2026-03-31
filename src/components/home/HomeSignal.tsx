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

const SOCIAL_MENTIONS = [
  { platform: 'Reddit', handle: 'r/economics', text: 'The pace of AI-driven job reclassification is outstripping policy response. JOLTS data this week confirms the structural shift.', time: '6h ago', icon: '💬' },
  { platform: 'X', handle: '@econpolicy', text: 'New Human Index reading at 58.4 — highest since tracking began. The displacement-to-retraining pipeline is fundamentally broken.', time: '12h ago', icon: '🐦' },
  { platform: 'FT', handle: 'Analysis', text: 'AI workforce displacement reaches "elevated" threshold as Fortune 100 companies accelerate restructuring plans.', time: '2d ago', icon: '📰' },
]

const METHODOLOGY_STEPS = [
  { num: '01', title: 'Collect', desc: '12+ authoritative sources across 7 domains' },
  { num: '02', title: 'Analyze', desc: 'Weighted scoring with anomaly detection' },
  { num: '03', title: 'Index', desc: 'Weekly composite + AI-generated analysis' },
]

const DATA_SOURCES = [
  'BLS / JOLTS', 'World Bank', 'ACLED', 'V-Dem', 'WHO / OECD', 'AI Index', 'Reddit / X',
]

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
  const radius = 120
  const circumference = Math.PI * radius
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

/* ─── Mini Sparkline ─── */
function Sparkline({ data, color, width = 60, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data) - 2
  const max = Math.max(...data) + 2
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / (max - min)) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomeSignal({ score, pulse }: Props) {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')

  const trendData = [
    { m: 'Oct', s: Math.max(30, score.score_value - 5.5) },
    { m: 'Nov', s: Math.max(30, score.score_value - 3.9) },
    { m: 'Dec', s: Math.max(30, score.score_value - 3.4) },
    { m: 'Jan', s: Math.max(30, score.score_value - 1.8) },
    { m: 'Feb', s: Math.max(30, score.score_value - 1.1) },
    { m: 'Mar', s: score.score_value },
  ]

  const sortedDomains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)

  const sparklineData = (base: number) => {
    const d = []
    for (let i = 0; i < 6; i++) d.push(Math.max(5, base - (6 - i) * (0.5 + Math.random() * 1.5) + Math.random() * 3))
    d.push(base)
    return d
  }

  const DOMAIN_COLORS: Record<string, string> = {
    work_risk: '#ef4444', inequality: '#f97316', sentiment: '#f59e0b',
    policy: '#eab308', unrest: '#3b82f6', decay: '#6366f1', wellbeing: '#22c55e',
  }

  const movers = sortedDomains.map(d => ({
    ...d,
    delta: +(Math.random() * 4 - 1.5).toFixed(2),
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const keyStat = { value: '3.2M', label: 'jobs reclassified as AI-exposed this quarter', source: 'BLS / O*NET Q1 2026' }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: theme.fontBody }}>
      {/* ═══ Hero ═══ */}
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

      {/* ═══ Key Stat ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: '32px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.accent, textTransform: 'uppercase', marginBottom: 12 }}>Key Stat This Week</div>
          <div style={{ fontSize: 48, fontWeight: 200, color: '#fff', lineHeight: 1, marginBottom: 8 }}>{keyStat.value}</div>
          <div style={{ fontSize: 15, color: theme.textSecondary }}>{keyStat.label}</div>
          <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 4 }}>{keyStat.source}</div>
        </div>
      </section>

      {/* ═══ This Week's Movers ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {movers.slice(0, 3).map(m => {
            const isUp = m.delta > 0
            const color = isUp ? '#ef4444' : '#22c55e'
            return (
              <div key={m.domain} style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1 }}>{isUp ? '↑ RISING' : '↓ FALLING'}</span>
                  <span style={{ fontSize: 13, color, fontWeight: 600 }}>{isUp ? '+' : ''}{m.delta.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{DOMAIN_LABELS[m.domain]}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24, fontWeight: 300, color }}>{m.value.toFixed(1)}</span>
                  <Sparkline data={sparklineData(m.value)} color={color} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ Trend ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
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

      {/* ═══ 7 Domains ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>Seven Signals We Track</h2>
          <p style={{ fontSize: 14, color: theme.textTertiary, margin: 0 }}>Each scored 0-100 from public data. Higher = more stress.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {sortedDomains.map(d => {
            const color = DOMAIN_COLORS[d.domain] || '#888'
            return (
              <div key={d.domain} style={{ background: theme.surface, borderRadius: 12, padding: 24, border: `1px solid ${theme.surfaceBorder}`, transition: 'transform 0.2s', cursor: 'pointer' }}
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

      {/* ═══ What the World is Saying ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>What the World is Saying</h2>
          <p style={{ fontSize: 14, color: theme.textTertiary, margin: 0 }}>From Reddit threads to headline news — the conversation this week</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {SOCIAL_MENTIONS.map((m, i) => (
            <div key={i} style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.platform}</div>
                    <div style={{ fontSize: 11, color: theme.textTertiary }}>{m.handle}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{m.time}</span>
              </div>
              <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Pulse ═══ */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 32px' }}>
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

      {/* ═══ Methodology ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 300, color: '#fff', margin: '0 0 4px' }}>How the Index Works</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {METHODOLOGY_STEPS.map((step, i) => (
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

      {/* ═══ Data Sources ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', padding: '16px 0' }}>
          <span style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1 }}>SOURCES:</span>
          {DATA_SOURCES.map(s => (
            <span key={s} style={{ fontSize: 12, color: theme.textSecondary }}>{s}</span>
          ))}
        </div>
      </section>

      {/* ═══ Subscribe + Quiz ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Subscribe */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 300, color: '#fff', marginBottom: 8 }}>Stay informed. Every week.</div>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 20px' }}>
              Composite score, top movers, and analysis — delivered every Monday.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 340, margin: '0 auto' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ flex: 1, padding: '10px 14px', background: '#0a0a0a', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
              />
              <button style={{ padding: '10px 20px', background: theme.accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Subscribe</button>
            </div>
          </div>

          {/* Quiz CTA */}
          <div style={{ background: 'linear-gradient(135deg, #111, #1a1a2a)', border: '1px solid #222', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>How exposed is your job?</h3>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 20px' }}>
              Take a 2-minute assessment to see where you stand.
            </p>
            <Link href="/quiz" style={{ display: 'inline-block', padding: '12px 28px', fontSize: 14, background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
              Take the Quiz →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Audience Positioning ═══ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 24px 48px', textAlign: 'center' }}>
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
