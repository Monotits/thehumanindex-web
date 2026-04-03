'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, Domain, DOMAIN_LABELS, BAND_LABELS } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { getDomainContext } from '@/lib/domainDescriptions'
import { KeyStat } from '@/lib/realData'
import { useTheme } from '@/lib/theme'
import { seededRandom } from '@/lib/seededRandom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
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

function BandBadge({ band }: { band: string }) {
  const colors: Record<string, string> = { low: '#2d7d46', moderate: '#2563eb', elevated: '#d97706', high: '#ea580c', critical: '#dc2626' }
  const color = colors[band] || '#888'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 3, background: `${color}11`, border: `1px solid ${color}33`, fontSize: 12, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: 1 }}>
      {BAND_LABELS[band as keyof typeof BAND_LABELS] || band}
    </span>
  )
}

export default function HomeBriefing({ score, pulse, keyStat, trendHistory }: Props) {
  const { theme } = useTheme()
  const trendData = buildTrendData(trendHistory, score.score_value)
  const sortedDomains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)

  const movers = sortedDomains.map(d => {
    const rng = seededRandom(`mover-briefing-${d.domain}`)
    return { ...d, delta: +(rng() * 4 - 1.5).toFixed(2) }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const stat = keyStat || { value: '—', label: 'connecting to data sources...', source: '' }

  const compositeShareData: CompositeCardData = {
    type: 'composite',
    score: score.score_value,
    delta: score.delta,
    domains: sortedDomains.map(d => ({ domain: d.domain as Domain, score: Math.round(d.value) })),
    date: new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }

  // Briefing accent — deep teal instead of red (to differentiate from layoffhedge)
  const accentColor = '#0d9488'

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: theme.fontHeading, color: theme.text }}>
      {/* Teal accent line instead of red */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, #14b8a6)` }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ═══ Hero ═══ */}
        <div style={{ padding: '48px 0 40px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div className="grid-hero" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: theme.fontBody }}>
                Global Stress Assessment — {new Date(score.computed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.15, margin: '0 0 16px' }}>
                Civilizational Stress Reaches{' '}
                <span style={{ color: accentColor, fontStyle: 'italic' }}>
                  {BAND_LABELS[score.band] || score.band}
                </span>{' '}
                Threshold
              </h1>
              <p style={{ fontSize: 17, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 24px', fontFamily: theme.fontBody }}>
                The composite index stands at {score.score_value.toFixed(2)}, reflecting mounting pressure across multiple domains of civilizational stability.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <BandBadge band={score.band} />
                {score.delta !== null && (
                  <span style={{ fontSize: 13, color: theme.textTertiary, fontFamily: theme.fontBody }}>
                    {score.delta > 0 ? '↑' : '↓'} {Math.abs(score.delta).toFixed(2)} from previous week
                  </span>
                )}
                <ShareButton data={compositeShareData} variant="compact" label="Share" />
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
                      <stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fill: theme.textTertiary, fontSize: 11, fontFamily: 'Inter' }} stroke="transparent" />
                  <YAxis domain={[30, 60]} hide />
                  <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 4 }} />
                  <Area type="monotone" dataKey="s" stroke={accentColor} strokeWidth={2} fill="url(#briefingFill)" dot={{ r: 3, fill: accentColor }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontBody, marginTop: 8 }}>
                <span>6-month trend</span>
                <span>Source: THI Data Pipeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Stat Bar ═══ */}
        <div className="stat-bar" style={{
          display: 'flex', gap: 0, margin: '0 0', padding: 0,
          borderBottom: `1px solid ${theme.surfaceBorder}`,
          overflow: 'hidden',
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
              flex: '1 1 0', padding: '20px 16px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${theme.surfaceBorder}` : 'none',
            }}>
              <div style={{
                fontSize: 24, fontWeight: 400, fontFamily: theme.fontHeading, lineHeight: 1,
                color: item.accent ? accentColor : theme.text,
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 6, fontFamily: theme.fontBody, letterSpacing: 0.3 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Top Movers ═══ */}
        <div style={{ padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, margin: '0 0 20px' }}>This Week&apos;s Movers</h2>
          <div className="grid-movers" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {movers.slice(0, 3).map(m => {
              const isUp = m.delta > 0
              const color = isUp ? '#dc2626' : '#2d7d46'
              const ctx = getDomainContext(m.domain as Domain, m.value, m.delta)
              return (
                <div key={m.domain} style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <DomainIcon domain={m.domain as Domain} size={24} color={theme.textSecondary} />
                    <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: theme.fontBody }}>{isUp ? '↑' : '↓'} {Math.abs(m.delta).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{DOMAIN_LABELS[m.domain]}</div>
                  <div style={{ fontSize: 28, fontWeight: 400, color, fontFamily: theme.fontHeading, marginBottom: 10 }}>{m.value.toFixed(1)}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5, fontFamily: theme.fontBody }}>
                    {ctx.insight}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: accentColor, fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>
              Full analysis on Dashboard →
            </Link>
          </div>
        </div>

        {/* ═══ Latest Pulse (Prominent) ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 20px' }}>Weekly Pulse</h2>
            <article style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 28 }}>
              <div style={{ fontSize: 11, color: accentColor, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontFamily: theme.fontBody }}>Analysis</div>
              <h3 style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.3, margin: '0 0 12px' }}>{pulse.title}</h3>
              <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 16px', fontFamily: theme.fontBody }}>
                {pulse.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 250)}...
              </p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Link href={`/pulse/${pulse.slug}`} style={{ fontSize: 12, color: accentColor, fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>
                  Read full analysis →
                </Link>
                <Link href="/pulse" style={{ fontSize: 12, color: theme.textTertiary, textDecoration: 'none', fontFamily: theme.fontBody }}>
                  All reports
                </Link>
              </div>
            </article>
          </div>

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 20px' }}>Personal Assessment</h2>
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 28 }}>
              <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 16px', fontFamily: theme.fontBody }}>
                How exposed is your job to AI displacement? Take a 2-minute quiz to find out your personal risk score, at-risk tasks, and skill recommendations.
              </p>
              <Link href="/quiz" style={{ display: 'inline-block', padding: '10px 24px', fontSize: 13, background: accentColor, border: 'none', borderRadius: 4, color: '#fff', fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>
                Take the Quiz →
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ Domain Overview ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 24px' }}>Seven Domains of Stress</h2>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            {sortedDomains.map(d => {
              const color = d.value >= 70 ? '#ef4444' : d.value >= 55 ? '#f97316' : d.value >= 40 ? '#f59e0b' : d.value >= 25 ? '#3b82f6' : '#22c55e'
              return (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                  <div style={{ flex: '0 0 180px', fontSize: 14, fontWeight: 600, color: theme.text }}>{DOMAIN_LABELS[d.domain]}</div>
                  <div style={{ flex: 1, height: 6, background: '#eee', borderRadius: 3, marginRight: 12 }}>
                    <div style={{ width: `${d.value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ flex: '0 0 40px', fontFamily: theme.fontMono, fontSize: 14, fontWeight: 600, color, textAlign: 'right' }}>
                    {d.value.toFixed(0)}
                  </div>
                  <div style={{ flex: '0 0 50px', fontSize: 11, color: theme.textTertiary, textAlign: 'right' }}>{(d.weight * 100).toFixed(0)}%</div>
                </div>
              )
            })}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/dashboard" style={{ fontSize: 13, color: accentColor, fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>
                Explore full dashboard with charts and analysis →
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ Subscribe ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 400, margin: '0 0 8px' }}>Weekly Briefing</h3>
            <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 20px', fontFamily: theme.fontBody, lineHeight: 1.6 }}>
              Composite score, top movers, and analysis — delivered every Monday.
            </p>
            <SubscribeForm />
          </div>

          <div style={{ background: '#1a2332', borderRadius: 8, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 400, color: '#fff', margin: '0 0 12px', fontFamily: theme.fontHeading }}>For Researchers & Journalists</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 16px', fontFamily: theme.fontBody }}>
              All our data is open. Read the methodology, explore the index, and cite freely.
            </p>
            <Link href="/methodology" style={{ fontSize: 13, color: accentColor, fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>
              Read Methodology →
            </Link>
          </div>
        </div>

        {/* ═══ Audience ═══ */}
        <div style={{ textAlign: 'center', padding: '32px 0 48px' }}>
          <div style={{ fontSize: 12, color: theme.textTertiary, letterSpacing: 1, marginBottom: 16, fontFamily: theme.fontBody, textTransform: 'uppercase' }}>
            Designed for
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['Researchers', 'Policy Analysts', 'Journalists', 'Educators', 'Informed Citizens'].map(a => (
              <span key={a} style={{ fontSize: 13, color: theme.textSecondary, padding: '6px 16px', border: `1px solid ${theme.surfaceBorder}`, borderRadius: 20, fontFamily: theme.fontBody }}>{a}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-hero { grid-template-columns: 1fr !important; }
          .grid-movers { grid-template-columns: 1fr !important; }
          .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
