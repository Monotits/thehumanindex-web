'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, DOMAIN_LABELS } from '@/lib/types'
import { useTheme } from '@/lib/theme'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { useEffect, useState } from 'react'

interface Props {
  score: CompositeScore
  pulse: Commentary
}

/* ─── Ticker Bar ─── */
function TickerBar({ score }: { score: CompositeScore }) {
  const items = [
    `THI ${score.score_value.toFixed(2)} ${score.delta && score.delta > 0 ? '▲' : '▼'}${Math.abs(score.delta || 0).toFixed(2)}`,
    ...(score.sub_indexes?.map(s => {
      const label = s.domain.replace(/_/g, ' ').toUpperCase()
      return `${label} ${s.value.toFixed(1)}`
    }) || []),
  ]

  return (
    <div style={{ background: '#050505', borderBottom: '1px solid #1a1a1a', padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'inline-block', animation: 'ticker 30s linear infinite' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ marginRight: 48, fontFamily: 'var(--thi-font-mono)', fontSize: 12, letterSpacing: 0.5, color: item.includes('▼') ? '#ff3333' : '#00ff88' }}>
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  )
}

/* ─── Mini Sparkline (simple SVG) ─── */
function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
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
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length - 1] - min) / (max - min)) * height} r="2" fill={color} />
    </svg>
  )
}

/* ─── Data Sources ─── */
const DATA_SOURCES = [
  { name: 'BLS / JOLTS', desc: 'Employment' },
  { name: 'World Bank', desc: 'Inequality' },
  { name: 'ACLED', desc: 'Conflict' },
  { name: 'V-Dem', desc: 'Democracy' },
  { name: 'WHO / OECD', desc: 'Wellbeing' },
  { name: 'AI Index', desc: 'Tech adoption' },
  { name: 'Reddit / X', desc: 'Sentiment' },
]

const SOCIAL_MENTIONS = [
  { platform: 'Reddit', handle: 'r/economics', text: 'The pace of AI-driven job reclassification is outstripping policy response. JOLTS data this week confirms the structural shift.', time: '6h ago', tag: 'SOCIAL' },
  { platform: 'X / Twitter', handle: '@econpolicy', text: 'New Human Index reading at 58.4 — highest since tracking began. The displacement-to-retraining pipeline is fundamentally broken.', time: '12h ago', tag: 'SOCIAL' },
  { platform: 'Financial Times', handle: 'Analysis', text: 'AI workforce displacement reaches "elevated" threshold as Fortune 100 companies accelerate restructuring plans.', time: '2d ago', tag: 'PRESS' },
]

const METHODOLOGY_STEPS = [
  { num: '01', title: 'Collect', desc: 'Real-time feeds from 12+ authoritative sources across 7 domains' },
  { num: '02', title: 'Analyze', desc: 'Weighted scoring with statistical normalization and anomaly detection' },
  { num: '03', title: 'Index', desc: 'Single composite score updated weekly, with AI-generated analysis' },
]

export default function HomeTerminal({ score, pulse }: Props) {
  const { theme } = useTheme()
  const [pulseAnim, setPulseAnim] = useState(1)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const t = setInterval(() => setPulseAnim(p => p === 1 ? 0.5 : 1), 2000)
    return () => clearInterval(t)
  }, [])

  const bandColor = score.band === 'critical' ? '#ff3333' : score.band === 'high' ? '#ff6b35' : score.band === 'elevated' ? '#ff6b35' : score.band === 'moderate' ? '#3b82f6' : '#00ff88'

  const radarData = score.sub_indexes?.map(s => ({
    domain: (DOMAIN_LABELS[s.domain] || s.domain).split(' ').slice(0, 2).join(' '),
    value: s.value,
    fullMark: 100,
  })) || []

  const domains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)

  // Generate mock sparkline data for each domain
  const sparklineData = (base: number) => {
    const d = []
    for (let i = 0; i < 6; i++) d.push(Math.max(5, base - (6 - i) * (0.5 + Math.random() * 1.5) + Math.random() * 3))
    d.push(base)
    return d
  }

  // Movers — top 2 risers and top 1 faller (simulated deltas)
  const movers = domains.map(d => ({
    ...d,
    delta: +(Math.random() * 4 - 1.5).toFixed(2),
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const topRisers = movers.filter(m => m.delta > 0).slice(0, 2)
  const topFallers = movers.filter(m => m.delta < 0).slice(0, 1)

  // Key stat
  const keyStat = {
    value: '3.2M',
    label: 'jobs reclassified as AI-exposed this quarter',
    source: 'BLS / O*NET Q1 2026',
  }

  const sectionHeader = (text: string) => (
    <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16, fontFamily: theme.fontMono }}>{text}</div>
  )

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: theme.fontBody }}>
      <TickerBar score={score} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* ═══ Score Hero ═══ */}
        <div style={{ textAlign: 'center', padding: '56px 20px 40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: bandColor, opacity: pulseAnim, transition: 'opacity 1s ease' }} />
            <span style={{ fontFamily: theme.fontMono, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: bandColor }}>
              {score.band} — Updated {new Date(score.computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div style={{ fontSize: 96, fontWeight: 200, color: '#fff', lineHeight: 1, marginBottom: 8 }}>
            {Math.floor(score.score_value)}<span style={{ fontSize: 48, color: theme.textTertiary }}>.{(score.score_value % 1).toFixed(2).slice(2)}</span>
          </div>
          <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Composite Stress Index</div>
          {score.delta !== null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 4, background: `${bandColor}15`, border: `1px solid ${bandColor}30` }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: bandColor }}>{score.delta > 0 ? '▲' : '▼'} {Math.abs(score.delta).toFixed(2)}</span>
              <span style={{ fontSize: 12, color: theme.textTertiary }}>WoW</span>
            </div>
          )}
        </div>

        {/* ═══ This Week's Movers ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[...topRisers, ...topFallers].map(m => {
            const isUp = m.delta > 0
            const color = isUp ? '#ff3333' : '#00ff88'
            return (
              <div key={m.domain} style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: theme.textTertiary, fontFamily: theme.fontMono }}>{isUp ? '▲ RISING' : '▼ FALLING'}</span>
                  <span style={{ fontSize: 13, color, fontFamily: theme.fontMono, fontWeight: 600 }}>{isUp ? '+' : ''}{m.delta.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{DOMAIN_LABELS[m.domain]}</div>
                <div style={{ fontSize: 24, fontWeight: 300, color, fontFamily: theme.fontMono }}>{m.value.toFixed(1)}</div>
              </div>
            )
          })}
        </div>

        {/* ═══ Key Stat of the Week ═══ */}
        <div style={{ background: `linear-gradient(135deg, ${theme.surface}, #0a0a0a)`, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: '32px 40px', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.accent, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 12 }}>Key Stat This Week</div>
          <div style={{ fontSize: 56, fontWeight: 200, color: '#fff', lineHeight: 1, marginBottom: 12 }}>{keyStat.value}</div>
          <div style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 8 }}>{keyStat.label}</div>
          <div style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono }}>{keyStat.source}</div>
        </div>

        {/* ═══ Domain Table + Radar ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Domain Table */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            {sectionHeader('Domain Breakdown')}
            {domains.map(d => {
              const color = d.value >= 65 ? '#ff3333' : d.value >= 45 ? '#ff6b35' : d.value >= 25 ? '#3b82f6' : '#00ff88'
              return (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                  <div style={{ flex: '0 0 150px', fontSize: 13, color: theme.textSecondary }}>{DOMAIN_LABELS[d.domain] || d.domain}</div>
                  <div style={{ flex: 1, position: 'relative', height: 6, background: '#1a1a1a', borderRadius: 3, marginRight: 16 }}>
                    <div style={{ position: 'absolute', height: '100%', width: `${d.value}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <div style={{ flex: '0 0 48px', fontFamily: theme.fontMono, fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'right' }}>{d.value.toFixed(1)}</div>
                  <div style={{ flex: '0 0 40px', fontSize: 11, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                </div>
              )
            })}
          </div>

          {/* Radar */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            {sectionHeader('Distribution')}
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: theme.textTertiary, fontSize: 9 }} />
                <Radar dataKey="value" stroke={theme.accent} fill={theme.accent} fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══ Sparkline Grid — 7 Domains ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          {sectionHeader('6-Week Trend by Domain')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            {domains.map(d => {
              const color = d.value >= 65 ? '#ff3333' : d.value >= 45 ? '#ff6b35' : d.value >= 25 ? '#3b82f6' : '#00ff88'
              return (
                <div key={d.domain} style={{ padding: 12, background: '#0a0a0a', borderRadius: 4, border: `1px solid ${theme.surfaceBorder}` }}>
                  <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 6, fontFamily: theme.fontMono }}>{(DOMAIN_LABELS[d.domain] || d.domain).split(' ')[0]}</div>
                  <Sparkline data={sparklineData(d.value)} color={color} width={100} height={24} />
                  <div style={{ fontSize: 14, fontWeight: 600, color, fontFamily: theme.fontMono, marginTop: 6 }}>{d.value.toFixed(1)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══ Featured Insight ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Pulse Card */}
          <Link href={`/pulse/${pulse.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 24, cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1 }}>WEEKLY PULSE</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{new Date(pulse.published_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{pulse.title}</div>
              <div style={{ fontSize: 13, color: theme.textTertiary, lineHeight: 1.6 }}>
                {pulse.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 200)}...
              </div>
            </div>
          </Link>

          {/* Featured Insight */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.accent}33`, borderRadius: 6, padding: 24 }}>
            <div style={{ fontSize: 11, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1, marginBottom: 12 }}>FEATURED INSIGHT</div>
            <div style={{ fontSize: 28, fontWeight: 200, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
              &ldquo;The convergence of displacement acceleration and policy lag creates a window of systemic vulnerability.&rdquo;
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6 }}>
              Our models indicate that the gap between AI capability deployment and institutional response has widened to its largest margin since tracking began.
            </div>
          </div>
        </div>

        {/* ═══ Data Sources Strip ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 1 }}>DATA SOURCES:</span>
            {DATA_SOURCES.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary }}>{s.name}</span>
                <span style={{ fontSize: 10, color: theme.textTertiary }}>({s.desc})</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ What the World is Saying ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          {sectionHeader('What the World is Saying')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {SOCIAL_MENTIONS.map((m, i) => (
              <div key={i} style={{ background: '#0a0a0a', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 4, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent, fontFamily: theme.fontMono }}>{m.tag}</span>
                    <span style={{ fontSize: 11, color: theme.textTertiary, marginLeft: 8 }}>{m.platform} · {m.handle}</span>
                  </div>
                  <span style={{ fontSize: 10, color: theme.textTertiary }}>{m.time}</span>
                </div>
                <p style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.5, margin: 0 }}>{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Methodology at a Glance ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 32, marginBottom: 24 }}>
          {sectionHeader('Methodology at a Glance')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {METHODOLOGY_STEPS.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{ fontSize: 32, fontWeight: 200, color: theme.accent, opacity: 0.4, fontFamily: theme.fontMono, marginBottom: 8 }}>{step.num}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: theme.textTertiary, lineHeight: 1.6 }}>{step.desc}</div>
                {i < 2 && <div style={{ position: 'absolute', right: -12, top: 20, fontSize: 20, color: theme.textTertiary }}>→</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/methodology" style={{ fontSize: 12, color: theme.accent, fontFamily: theme.fontMono, textDecoration: 'none' }}>Read full methodology →</Link>
          </div>
        </div>

        {/* ═══ Quiz CTA ═══ */}
        <div style={{ background: `linear-gradient(135deg, #0a1a0a, ${theme.surface})`, border: `1px solid ${theme.accent}33`, borderRadius: 8, padding: '40px 48px', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.accent, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 16 }}>Personal Assessment</div>
          <div style={{ fontSize: 28, fontWeight: 300, color: '#fff', marginBottom: 12 }}>How exposed is your job to AI displacement?</div>
          <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Take a 2-minute assessment based on your role, skills, and region. See where you stand.
          </div>
          <Link href="/quiz" style={{ display: 'inline-block', padding: '12px 32px', fontSize: 14, background: theme.accent, border: 'none', borderRadius: 4, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
            Take the Quiz →
          </Link>
        </div>

        {/* ═══ Subscribe CTA ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 32, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 8 }}>Stay informed. Every week.</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
            Get the composite score, top movers, and AI-generated analysis delivered to your inbox every Monday.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 400, margin: '0 auto' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ flex: 1, padding: '10px 16px', background: '#0a0a0a', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 4, color: '#fff', fontSize: 13, fontFamily: theme.fontBody, outline: 'none' }}
            />
            <button style={{ padding: '10px 20px', background: theme.accent, border: 'none', borderRadius: 4, color: '#000', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Subscribe</button>
          </div>
        </div>

        {/* ═══ Audience Positioning ═══ */}
        <div style={{ textAlign: 'center', padding: '32px 0 48px', borderTop: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ fontSize: 12, color: theme.textTertiary, letterSpacing: 1, marginBottom: 16, fontFamily: theme.fontMono }}>
            BUILT FOR
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {['Researchers', 'Policy Analysts', 'Journalists', 'Macro Strategists', 'Anyone Who Pays Attention'].map(a => (
              <span key={a} style={{ fontSize: 14, color: theme.textSecondary, padding: '6px 16px', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 20 }}>{a}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
