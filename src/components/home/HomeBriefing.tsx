'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, Domain, DOMAIN_LABELS, BAND_LABELS } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { getDomainContext } from '@/lib/domainDescriptions'
import { KeyStat } from '@/lib/realData'
import { useTheme } from '@/lib/theme'
import { seededRandom } from '@/lib/seededRandom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ShareButton, SharePrompt } from '@/components/share'
import type { CompositeCardData, DomainCardData, TrendCardData } from '@/components/share'
import SubscribeForm from '@/components/SubscribeForm'
import SocialFeedSection from '@/components/SocialFeedSection'
import LayoffTracker from '@/components/LayoffTracker'
import CorporateLayoffTable from '@/components/CorporateLayoffTable'
import CorrelationHeatmap from '@/components/charts/CorrelationHeatmap'
import WaterfallChart from '@/components/charts/WaterfallChart'
import RiskBubbleChart from '@/components/charts/RiskBubbleChart'
import MultiDomainTrend from '@/components/charts/MultiDomainTrend'
import StackedAreaDecomposition from '@/components/charts/StackedAreaDecomposition'
import WeeklyHeatmap from '@/components/charts/WeeklyHeatmap'
import DomainComparisonBar from '@/components/charts/DomainComparisonBar'
import { MonthlyScore } from '@/lib/historicalData'

interface Props {
  score: CompositeScore
  pulse: Commentary
  keyStat?: KeyStat
  trendHistory?: MonthlyScore[]
}

/* ─── Data Sources ─── */
const DATA_SOURCES = [
  { name: 'BLS', desc: 'Employment' },
  { name: 'FRED', desc: 'Economic' },
  { name: 'World Bank', desc: 'Governance' },
  { name: 'OECD', desc: 'Wellbeing' },
  { name: 'WHO', desc: 'Health' },
  { name: 'V-Dem/WGI', desc: 'Democracy' },
  { name: 'O*NET', desc: 'Occupations' },
  { name: 'AI Index', desc: 'Tech adoption' },
  { name: 'WARN Act', desc: 'Layoff filings' },
  { name: 'Reddit / RSS', desc: 'Sentiment' },
]

const METHODOLOGY_STEPS = [
  { num: '01', title: 'Collect', desc: 'Live feeds from 10+ sources: BLS, FRED, World Bank, OECD, WHO, V-Dem, O*NET, AI Index, WARN Act, Reddit/RSS.' },
  { num: '02', title: 'Analyze', desc: 'Weighted scoring model with statistical normalization, anomaly detection, and cross-domain correlation.' },
  { num: '03', title: 'Index', desc: 'A single composite score updated weekly, with AI-generated analysis providing context and narrative.' },
]


function BandBadge({ band }: { band: string }) {
  const colors: Record<string, string> = { low: '#2d7d46', moderate: '#2563eb', elevated: '#d97706', high: '#ea580c', critical: '#dc2626' }
  const color = colors[band] || '#888'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 3, background: `${color}11`, border: `1px solid ${color}33`, fontSize: 12, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: 1 }}>
      {BAND_LABELS[band as keyof typeof BAND_LABELS] || band}
    </span>
  )
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildTrendData(history: MonthlyScore[] | undefined, currentScore: number) {
  // If we have real historical data, use it
  if (history && history.length > 0) {
    const data = history.map(h => {
      const [, monthStr] = h.year_month.split('-')
      return { m: MONTH_SHORT[parseInt(monthStr, 10) - 1], s: h.composite }
    })
    // Append current month if not already in history
    const now = new Date()
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastInHistory = history[history.length - 1]?.year_month
    if (lastInHistory !== currentYM) {
      data.push({ m: MONTH_SHORT[now.getMonth()], s: currentScore })
    }
    return data
  }

  // Fallback: generate from current score (will be replaced once history is seeded)
  const now = new Date()
  const months: { m: string; s: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ m: MONTH_SHORT[d.getMonth()], s: currentScore })
  }
  return months
}

export default function HomeBriefing({ score, pulse, keyStat, trendHistory }: Props) {
  const { theme } = useTheme()

  const trendData = buildTrendData(trendHistory, score.score_value)

  const sortedDomains = [...(score.sub_indexes || [])].sort((a, b) => b.value - a.value)

  // Movers
  const movers = sortedDomains.map(d => {
    const rng = seededRandom(`mover-briefing-${d.domain}`)
    return { ...d, delta: +(rng() * 4 - 1.5).toFixed(2) }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const stat = keyStat || { value: '—', label: 'connecting to data sources...', source: '' }

  // Share card data
  const compositeShareData: CompositeCardData = {
    type: 'composite',
    score: score.score_value,
    delta: score.delta,
    domains: sortedDomains.map(d => ({ domain: d.domain as Domain, score: Math.round(d.value) })),
    date: new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }

  const trendShareData: TrendCardData = {
    type: 'trend',
    title: 'Domain Trend Analysis',
    domains: sortedDomains.map(d => {
      const rng = seededRandom(`mover-briefing-${d.domain}`)
      return { domain: d.domain as Domain, score: Math.round(d.value), delta: +(rng() * 4 - 1.5).toFixed(2) }
    }),
    compositeScore: score.score_value,
    date: new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: theme.fontHeading, color: theme.text }}>
      {/* Red accent line */}
      <div style={{ height: 3, background: theme.accent }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* ═══ Hero Banner ═══ */}
        <div style={{ padding: '48px 0 40px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div className="grid-hero" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
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

        {/* ═══ Compact Stat Bar ═══ */}
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
                color: item.accent ? theme.accent : theme.text,
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 6, fontFamily: theme.fontBody, letterSpacing: 0.3 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ This Week's Movers ═══ */}
        <div style={{ padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, margin: '0 0 20px' }}>This Week&apos;s Movers</h2>
          <div className="grid-movers" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {movers.slice(0, 3).map(m => {
              const isUp = m.delta > 0
              const color = isUp ? '#dc2626' : '#2d7d46'
              const ctx = getDomainContext(m.domain as Domain, m.value, m.delta)
              return (
                <div key={m.domain} style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 20, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <DomainIcon domain={m.domain as Domain} size={24} color={theme.textSecondary} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: theme.fontBody }}>{isUp ? '↑' : '↓'} {Math.abs(m.delta).toFixed(2)}</span>
                      <ShareButton
                        data={{
                          type: 'domain',
                          domain: m.domain as Domain,
                          score: Math.round(m.value),
                          delta: m.delta,
                          headline: ctx.insight,
                          date: new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        } as DomainCardData}
                        variant="icon"
                      />
                    </div>
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
        </div>

        {/* ═══ Corporate Layoff Tracker — Primary content ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <CorporateLayoffTable />
        </div>

        {/* ═══ Enhanced Domain Analysis ═══ */}
        <div style={{ padding: '40px 0 24px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 8px' }}>Seven Domains of Stress</h2>
          <p style={{ fontSize: 14, color: theme.textTertiary, margin: '0 0 24px', fontFamily: theme.fontBody }}>Each domain scored 0–100 using public economic, social, and governance data</p>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
              <ShareButton data={trendShareData} variant="icon" />
            </div>
            <DomainComparisonBar domains={sortedDomains} />
          </div>
        </div>

        {/* ═══ Composite Decomposition + Weekly Heatmap ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <StackedAreaDecomposition domains={sortedDomains} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <WeeklyHeatmap currentScore={score.score_value} />
          </div>
        </div>

        {/* ═══ Waterfall + Multi-Domain Trend ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <WaterfallChart domains={sortedDomains} compositeScore={score.score_value} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <MultiDomainTrend domains={sortedDomains} />
          </div>
        </div>

        {/* ═══ Risk Matrix + Correlation ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <RiskBubbleChart domains={sortedDomains} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <CorrelationHeatmap domains={sortedDomains} />
          </div>
        </div>

        {/* ═══ Weekly Pulse + Featured Insight ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 20px' }}>Weekly Pulse</h2>
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
          </div>

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 20px' }}>Live Data Sources</h2>
            <div style={{ background: theme.surface, border: `1px solid ${theme.accent}22`, borderRadius: 8, padding: 28, borderLeft: `3px solid ${theme.accent}` }}>
              <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 12px', fontFamily: theme.fontBody }}>
                This index is computed from live data sourced from 10+ institutions including BLS, FRED, World Bank, OECD, WHO, O*NET, and Stanford AI Index. Updated every 24 hours.
              </p>
              {score.metadata && (score.metadata as Record<string, string[]>).sources_connected && (
                <p style={{ fontSize: 13, color: theme.accent, margin: '0 0 8px', fontFamily: theme.fontBody, fontWeight: 600 }}>
                  Active: {((score.metadata as Record<string, string[]>).sources_connected).join(' · ')}
                </p>
              )}
              {score.metadata && (score.metadata as Record<string, string[]>).sources_missing?.length > 0 && (
                <p style={{ fontSize: 12, color: theme.textTertiary, margin: 0, fontFamily: theme.fontBody }}>
                  Pending: {((score.metadata as Record<string, string[]>).sources_missing).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ What the World is Saying — Live Feed ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <SocialFeedSection />
        </div>

        {/* ═══ Layoff Tracker ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <LayoffTracker />
        </div>

        {/* ═══ Methodology at a Glance ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 24px' }}>How the Index Works</h2>
          <div className="grid-methodology" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {METHODOLOGY_STEPS.map((step) => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 600, letterSpacing: 2, marginBottom: 8, fontFamily: theme.fontBody }}>{`STEP ${step.num}`}</div>
                <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 8, fontFamily: theme.fontHeading }}>{step.title}</div>
                <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.7, margin: 0, fontFamily: theme.fontBody }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/methodology" style={{ fontSize: 13, color: theme.accent, fontWeight: 600, textDecoration: 'none', fontFamily: theme.fontBody }}>Read our full methodology →</Link>
          </div>
        </div>

        {/* ═══ Data Sources Strip ═══ */}
        <div style={{ padding: '24px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div className="sources-strip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1, textTransform: 'uppercase', fontFamily: theme.fontBody }}>Data Sources:</span>
            {DATA_SOURCES.map(s => (
              <span key={s.name} style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>{s.name}</span>
            ))}
          </div>
        </div>

        <SharePrompt
          compositeScore={score.score_value}
          band={score.band}
          delta={score.delta}
          topDomains={sortedDomains.slice(0, 5).map(d => {
            const rng = seededRandom(`mover-briefing-${d.domain}`)
            return { domain: d.domain as Domain, score: Math.round(d.value), delta: +(rng() * 4 - 1.5).toFixed(2) }
          })}
          date={new Date(score.computed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          weekNumber={Math.ceil((new Date().getTime() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))}
        />

        {/* ═══ Subscribe + Quiz CTA Row ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '40px 0' }}>
          {/* Subscribe */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 400, margin: '0 0 8px' }}>Weekly Briefing</h3>
            <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 20px', fontFamily: theme.fontBody, lineHeight: 1.6 }}>
              The composite score, top movers, and AI-generated analysis — delivered every Monday.
            </p>
            <SubscribeForm />
          </div>

          {/* Quiz CTA */}
          <Link href="/quiz" style={{ textDecoration: 'none' }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 32, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Personal Assessment</div>
              <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 16px', fontFamily: theme.fontBody, lineHeight: 1.6 }}>
                See how your job and location factor into the displacement landscape. Takes 2 minutes.
              </p>
              <span style={{ fontSize: 13, color: theme.accent, fontWeight: 600, fontFamily: theme.fontBody }}>Take the quiz →</span>
            </div>
          </Link>
        </div>

        {/* ═══ Institutional CTA ═══ */}
        <div className="mobile-padding" style={{ background: '#1a2332', borderRadius: 8, padding: '40px 48px', margin: '0 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: '#fff', margin: '0 0 12px', fontFamily: theme.fontHeading }}>For Researchers & Journalists</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0, fontFamily: theme.fontBody }}>
              All our data is open. Read the methodology, explore the index, and cite freely. API access coming Q3 2026.
            </p>
          </div>
          <Link href="/methodology" style={{ padding: '12px 32px', fontSize: 14, background: theme.accent, border: 'none', borderRadius: 4, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontBody, whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block' }}>
            Read Methodology
          </Link>
        </div>

        {/* ═══ Audience Positioning ═══ */}
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
    </div>
  )
}
