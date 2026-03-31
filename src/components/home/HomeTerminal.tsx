'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, DOMAIN_LABELS } from '@/lib/types'
import { useTheme } from '@/lib/theme'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { useEffect, useState } from 'react'

interface Props {
  score: CompositeScore
  pulse: Commentary
}

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

export default function HomeTerminal({ score, pulse }: Props) {
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

  const domains = score.sub_indexes?.sort((a, b) => b.value - a.value) || []

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: theme.fontBody }}>
      <TickerBar score={score} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Score Hero */}
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

        {/* Chart + Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Domain Table */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Domain Breakdown</div>
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
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 16 }}>Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: theme.textTertiary, fontSize: 9 }} />
                <Radar dataKey="value" stroke={theme.accent} fill={theme.accent} fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pulse Card */}
        <Link href={`/pulse/${pulse.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 24, marginBottom: 24, cursor: 'pointer' }}>
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

        {/* CTA */}
        <div style={{ background: `linear-gradient(135deg, #0a1a0a, ${theme.surface})`, border: `1px solid ${theme.accent}33`, borderRadius: 8, padding: '32px 40px', marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Integrate THI into your models</div>
            <div style={{ fontSize: 13, color: theme.textSecondary }}>REST API • Real-time webhooks • 7 domain scores + composite • Historical data</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/quiz" style={{ padding: '10px 24px', fontSize: 13, background: theme.accent, border: 'none', borderRadius: 4, color: '#000', fontWeight: 600, textDecoration: 'none' }}>Take the Quiz →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
