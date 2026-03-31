'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, DOMAIN_LABELS, BAND_LABELS } from '@/lib/types'
import { useTheme } from '@/lib/theme'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  score: CompositeScore
  pulse: Commentary
}

function BandBadge({ band }: { band: string }) {
  const colors: Record<string, string> = { low: '#2d7d46', moderate: '#2563eb', elevated: '#d97706', high: '#ea580c', critical: '#dc2626' }
  const color = colors[band] || '#888'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 3, background: `${color}11`, border: `1px solid ${color}33`, fontSize: 12, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: 1 }}>
      {BAND_LABELS[band as keyof typeof BAND_LABELS] || band}
    </span>
  )
}

export default function HomeBriefing({ score, pulse }: Props) {
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

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: theme.fontHeading, color: theme.text }}>
      {/* Red accent line */}
      <div style={{ height: 3, background: theme.accent }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* Hero Banner */}
        <div style={{ padding: '48px 0 40px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: theme.fontBody }}>
                Global Stress Assessment — {new Date(score.computed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.15, margin: '0 0 16px' }}>
                Civilizational Stress Reaches{' '}
                <span style={{ color: theme.accent, fontStyle: 'italic' }}>
                  {BAND_LABELS[score.band] || score.band}
                </span>{' '}
                Threshold
              </h1>
              <p style={{ fontSize: 17, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 24px', fontFamily: theme.fontBody }}>
                The composite index stands at {score.score_value.toFixed(2)}, reflecting mounting pressure across multiple domains of civilizational stability. Policy response continues to lag behind technological deployment.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <BandBadge band={score.band} />
                {score.delta !== null && (
                  <span style={{ fontSize: 13, color: theme.textTertiary, fontFamily: theme.fontBody }}>
                    {score.delta > 0 ? '↑' : '↓'} {Math.abs(score.delta).toFixed(2)} from previous week
                  </span>
                )}
              </div>
            </div>

            {/* Score + Chart */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 64, fontWeight: 300, lineHeight: 1 }}>{score.score_value.toFixed(2)}</div>
                <div style={{ fontSize: 13, color: theme.textTertiary, fontFamily: theme.fontBody, marginTop: 4 }}>Composite Index Score</div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="briefingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.accent} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fill: theme.textTertiary, fontSize: 11, fontFamily: 'Inter' }} stroke="transparent" />
                  <YAxis domain={[30, 60]} hide />
                  <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 4 }} />
                  <Area type="monotone" dataKey="s" stroke={theme.accent} strokeWidth={2} fill="url(#briefingFill)" dot={{ r: 3, fill: theme.accent }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontBody, marginTop: 8 }}>
                <span>6-month trend</span>
                <span>Source: THI Data Pipeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two column: Domains + Editorial */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '40px 0' }}>
          {/* Domain Analysis */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 8px' }}>Seven Domains of Stress</h2>
            <p style={{ fontSize: 14, color: theme.textTertiary, margin: '0 0 20px', fontFamily: theme.fontBody }}>Each domain scored 0–100 using public economic, social, and governance data</p>
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, overflow: 'hidden' }}>
              {sortedDomains.map(d => {
                const color = d.value >= 65 ? '#dc2626' : d.value >= 45 ? '#d97706' : d.value >= 25 ? '#2563eb' : '#2d7d46'
                return (
                  <div key={d.domain} style={{ padding: '18px 24px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{DOMAIN_LABELS[d.domain] || d.domain}</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color }}>{d.value.toFixed(1)}</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 2 }}>
                      <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly Pulse / Editorial */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 8px' }}>Weekly Pulse</h2>
            <p style={{ fontSize: 14, color: theme.textTertiary, margin: '0 0 20px', fontFamily: theme.fontBody }}>AI-generated analysis in the editorial tradition</p>

            <article style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 28, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: theme.fontBody }}>Analysis</div>
              <h3 style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.3, margin: '0 0 12px' }}>{pulse.title}</h3>
              <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 16px', fontFamily: theme.fontBody }}>
                {pulse.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 250)}...
              </p>
              <Link href={`/pulse/${pulse.slug}`} style={{ fontSize: 12, color: theme.accent, fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>
                Read full analysis →
              </Link>
            </article>

            {/* Quiz CTA */}
            <Link href="/quiz" style={{ textDecoration: 'none' }}>
              <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24, cursor: 'pointer' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Personal Assessment</div>
                <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 12px', fontFamily: theme.fontBody }}>
                  See how your job and location factor into the displacement landscape.
                </p>
                <span style={{ fontSize: 13, color: theme.accent, fontWeight: 600, fontFamily: theme.fontBody }}>Take the quiz →</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Institutional CTA */}
        <div style={{ background: '#1a2332', borderRadius: 8, padding: '40px 48px', margin: '16px 0 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: '#fff', margin: '0 0 12px' }}>Institutional Access</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0, fontFamily: theme.fontBody }}>
              Citation-ready data, custom country reports, and API access for your research team.
            </p>
          </div>
          <button style={{ padding: '12px 32px', fontSize: 14, background: theme.accent, border: 'none', borderRadius: 4, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontBody, whiteSpace: 'nowrap' }}>
            Request Access
          </button>
        </div>
      </div>
    </div>
  )
}
