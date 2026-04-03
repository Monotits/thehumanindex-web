'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, Domain, DOMAIN_LABELS } from '@/lib/types'
import { getDomainContext } from '@/lib/domainDescriptions'
import { KeyStat } from '@/lib/realData'
import { useTheme } from '@/lib/theme'
import { seededRandom } from '@/lib/seededRandom'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { useEffect, useState } from 'react'
import { ShareButton } from '@/components/share'
import type { CompositeCardData } from '@/components/share'
import SubscribeForm from '@/components/SubscribeForm'

interface Props {
  score: CompositeScore
  pulse: Commentary
  keyStat?: KeyStat
  trendHistory?: unknown[]
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

export default function HomeTerminal({ score, pulse, keyStat }: Props) {
  const { theme } = useTheme()
  const [pulseAnim, setPulseAnim] = useState(1)

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

  const movers = domains.map(d => {
    const rng = seededRandom(`mover-terminal-${d.domain}`)
    return { ...d, delta: +(rng() * 4 - 1.5).toFixed(2) }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const topRisers = movers.filter(m => m.delta > 0).slice(0, 2)
  const topFallers = movers.filter(m => m.delta < 0).slice(0, 1)

  const stat = keyStat || { value: '—', label: 'connecting to data sources...', source: '' }

  const compositeShareData: CompositeCardData = {
    type: 'composite',
    score: score.score_value,
    delta: score.delta,
    domains: domains.map(d => ({ domain: d.domain as Domain, score: Math.round(d.value) })),
    date: new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            {score.delta !== null && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 4, background: `${bandColor}15`, border: `1px solid ${bandColor}30` }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: bandColor }}>{score.delta > 0 ? '▲' : '▼'} {Math.abs(score.delta).toFixed(2)}</span>
                <span style={{ fontSize: 12, color: theme.textTertiary }}>WoW</span>
              </div>
            )}
            <ShareButton data={compositeShareData} variant="compact" label="Share" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ padding: '10px 24px', fontSize: 13, background: theme.accent, border: 'none', borderRadius: 4, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
              Open Dashboard →
            </Link>
            <Link href="/quiz" style={{ padding: '10px 24px', fontSize: 13, background: 'transparent', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 4, color: theme.textSecondary, textDecoration: 'none' }}>
              Exposure Quiz
            </Link>
          </div>
        </div>

        {/* ═══ Movers ═══ */}
        <div className="grid-movers" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[...topRisers, ...topFallers].map(m => {
            const isUp = m.delta > 0
            const color = isUp ? '#ff3333' : '#00ff88'
            const ctx = getDomainContext(m.domain as Domain, m.value, m.delta)
            return (
              <div key={m.domain} style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: theme.textTertiary, fontFamily: theme.fontMono }}>{isUp ? '▲ RISING' : '▼ FALLING'}</span>
                  <span style={{ fontSize: 13, color, fontFamily: theme.fontMono, fontWeight: 600 }}>{isUp ? '+' : ''}{m.delta.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{DOMAIN_LABELS[m.domain]}</div>
                <div style={{ fontSize: 24, fontWeight: 300, color, fontFamily: theme.fontMono, marginBottom: 8 }}>{m.value.toFixed(1)}</div>
                <div style={{ fontSize: 11, color: theme.textTertiary, lineHeight: 1.5, fontFamily: theme.fontMono }}>{ctx.insight}</div>
              </div>
            )
          })}
        </div>

        {/* ═══ Stat Bar ═══ */}
        <div className="stat-bar" style={{
          display: 'flex', gap: 0, marginBottom: 24,
          background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, overflow: 'hidden',
        }}>
          {[
            { value: stat.value, label: stat.label.replace('initial ', '').replace(' this week', ''), accent: true },
            ...(score.sub_indexes?.sort((a, b) => b.value - a.value).slice(0, 3).map(s => ({
              value: s.value.toFixed(1),
              label: (DOMAIN_LABELS[s.domain] || s.domain).replace(/_/g, ' '),
              accent: false,
            })) || []),
          ].map((item, i, arr) => (
            <div key={i} style={{
              flex: '1 1 0', padding: '12px 16px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${theme.surfaceBorder}` : 'none',
            }}>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: theme.fontMono, lineHeight: 1, color: item.accent ? theme.accent : '#fff' }}>
                {item.value}
              </div>
              <div style={{ fontSize: 9, color: theme.textTertiary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, fontFamily: theme.fontMono }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Radar + Domain List ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16, fontFamily: theme.fontMono }}>Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: theme.textTertiary, fontSize: 9 }} />
                <Radar dataKey="value" stroke={theme.accent} fill={theme.accent} fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16, fontFamily: theme.fontMono }}>All Domains</div>
            {domains.map(d => {
              const color = d.value >= 70 ? '#ff3333' : d.value >= 55 ? '#ff6b35' : d.value >= 40 ? '#f59e0b' : d.value >= 25 ? '#3b82f6' : '#00ff88'
              return (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                  <div style={{ flex: '0 0 140px', fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: theme.fontMono }}>{DOMAIN_LABELS[d.domain]}</div>
                  <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 2, marginRight: 8 }}>
                    <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 2 }} />
                  </div>
                  <div style={{ flex: '0 0 35px', fontFamily: theme.fontMono, fontSize: 13, fontWeight: 600, color, textAlign: 'right' }}>{d.value.toFixed(0)}</div>
                </div>
              )
            })}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Link href="/dashboard" style={{ fontSize: 11, color: theme.accent, fontFamily: theme.fontMono, textDecoration: 'none' }}>Full analysis on Dashboard →</Link>
            </div>
          </div>
        </div>

        {/* ═══ Pulse ═══ */}
        <Link href={`/pulse/${pulse.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 24, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1 }}>WEEKLY PULSE</span>
              <span style={{ fontSize: 11, color: theme.textTertiary }}>{new Date(pulse.published_at).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{pulse.title}</div>
            <div style={{ fontSize: 13, color: theme.textTertiary, lineHeight: 1.6 }}>
              {pulse.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 250)}...
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: theme.accent, fontFamily: theme.fontMono }}>Read full analysis →</div>
          </div>
        </Link>

        {/* ═══ Quiz + Subscribe ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: `linear-gradient(135deg, #0a1a0a, ${theme.surface})`, border: `1px solid ${theme.accent}33`, borderRadius: 6, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.accent, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 16 }}>Personal Assessment</div>
            <div style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 12 }}>How exposed is your job?</div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>2-minute assessment based on your role, skills, and region.</div>
            <Link href="/quiz" style={{ display: 'inline-block', padding: '10px 28px', fontSize: 13, background: theme.accent, border: 'none', borderRadius: 4, color: '#000', fontWeight: 600, textDecoration: 'none' }}>
              Take the Quiz →
            </Link>
          </div>

          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 8 }}>Stay informed. Every week.</div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>Composite score and analysis delivered every Monday.</div>
            <div style={{ maxWidth: 340, margin: '0 auto' }}>
              <SubscribeForm />
            </div>
          </div>
        </div>

        {/* ═══ Audience ═══ */}
        <div style={{ textAlign: 'center', padding: '32px 0 48px', borderTop: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ fontSize: 12, color: theme.textTertiary, letterSpacing: 1, marginBottom: 16, fontFamily: theme.fontMono }}>BUILT FOR</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['Researchers', 'Policy Analysts', 'Journalists', 'Macro Strategists', 'Everyone'].map(a => (
              <span key={a} style={{ fontSize: 13, color: theme.textSecondary, padding: '6px 16px', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 20 }}>{a}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-movers { grid-template-columns: 1fr !important; }
          .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
