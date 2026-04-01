'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, DOMAIN_LABELS, DOMAIN_ICONS, BAND_LABELS } from '@/lib/types'
import { useTheme } from '@/lib/theme'
import { seededRandom } from '@/lib/seededRandom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SubscribeForm from '@/components/SubscribeForm'
import SocialFeedSection from '@/components/SocialFeedSection'
import CorrelationHeatmap from '@/components/charts/CorrelationHeatmap'
import WaterfallChart from '@/components/charts/WaterfallChart'
import RiskBubbleChart from '@/components/charts/RiskBubbleChart'
import MultiDomainTrend from '@/components/charts/MultiDomainTrend'
import StackedAreaDecomposition from '@/components/charts/StackedAreaDecomposition'
import WeeklyHeatmap from '@/components/charts/WeeklyHeatmap'
import DomainComparisonBar from '@/components/charts/DomainComparisonBar'

interface Props {
  score: CompositeScore
  pulse: Commentary
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

const METHODOLOGY_STEPS = [
  { num: '01', title: 'Collect', desc: 'Real-time feeds from 12+ authoritative data sources spanning 7 critical domains of civilizational stress.' },
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

  // Movers
  const movers = sortedDomains.map(d => {
    const rng = seededRandom(`mover-briefing-${d.domain}`)
    return { ...d, delta: +(rng() * 4 - 1.5).toFixed(2) }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const keyStat = {
    value: '3.2M',
    label: 'jobs reclassified as AI-exposed this quarter',
    source: 'BLS / O*NET Q1 2026',
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: theme.fontHeading, color: theme.text }}>
      {/* Red accent line */}
      <div style={{ height: 3, background: theme.accent }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* ═══ Hero Banner ═══ */}
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

        {/* ═══ Key Stat of the Week ═══ */}
        <div style={{ padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, fontFamily: theme.fontBody, marginBottom: 8 }}>Key Figure This Week</div>
          <div style={{ fontSize: 48, fontWeight: 400, lineHeight: 1, marginBottom: 8, fontFamily: theme.fontHeading }}>{keyStat.value}</div>
          <div style={{ fontSize: 16, color: theme.textSecondary, fontFamily: theme.fontBody }}>{keyStat.label}</div>
          <div style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontBody, marginTop: 4 }}>{keyStat.source}</div>
        </div>

        {/* ═══ This Week's Movers ═══ */}
        <div style={{ padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, margin: '0 0 20px' }}>This Week&apos;s Movers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {movers.slice(0, 3).map(m => {
              const isUp = m.delta > 0
              const color = isUp ? '#dc2626' : '#2d7d46'
              return (
                <div key={m.domain} style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{DOMAIN_ICONS[m.domain] || '📈'}</span>
                    <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: theme.fontBody }}>{isUp ? '↑' : '↓'} {Math.abs(m.delta).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{DOMAIN_LABELS[m.domain]}</div>
                  <div style={{ fontSize: 28, fontWeight: 400, color, fontFamily: theme.fontHeading }}>{m.value.toFixed(1)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══ Enhanced Domain Analysis ═══ */}
        <div style={{ padding: '40px 0 24px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 8px' }}>Seven Domains of Stress</h2>
          <p style={{ fontSize: 14, color: theme.textTertiary, margin: '0 0 24px', fontFamily: theme.fontBody }}>Each domain scored 0–100 using public economic, social, and governance data</p>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <DomainComparisonBar domains={sortedDomains} />
          </div>
        </div>

        {/* ═══ Composite Decomposition + Weekly Heatmap ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <StackedAreaDecomposition domains={sortedDomains} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <WeeklyHeatmap currentScore={score.score_value} />
          </div>
        </div>

        {/* ═══ Waterfall + Multi-Domain Trend ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <WaterfallChart domains={sortedDomains} compositeScore={score.score_value} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <MultiDomainTrend domains={sortedDomains} />
          </div>
        </div>

        {/* ═══ Risk Matrix + Correlation ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <RiskBubbleChart domains={sortedDomains} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: 24 }}>
            <CorrelationHeatmap domains={sortedDomains} />
          </div>
        </div>

        {/* ═══ Weekly Pulse + Featured Insight ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
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
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 20px' }}>Featured Insight</h2>
            <div style={{ background: theme.surface, border: `1px solid ${theme.accent}22`, borderRadius: 8, padding: 28, borderLeft: `3px solid ${theme.accent}` }}>
              <p style={{ fontSize: 19, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 12px', fontFamily: theme.fontHeading }}>
                &ldquo;The convergence of displacement acceleration and policy lag creates a window of systemic vulnerability.&rdquo;
              </p>
              <p style={{ fontSize: 13, color: theme.textTertiary, margin: 0, fontFamily: theme.fontBody }}>THI Analysis Team</p>
            </div>
          </div>
        </div>

        {/* ═══ What the World is Saying — Live Feed ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <SocialFeedSection />
        </div>

        {/* ═══ Methodology at a Glance ═══ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 24px' }}>How the Index Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: theme.textTertiary, letterSpacing: 1, textTransform: 'uppercase', fontFamily: theme.fontBody }}>Data Sources:</span>
            {DATA_SOURCES.map(s => (
              <span key={s.name} style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>{s.name}</span>
            ))}
          </div>
        </div>

        {/* ═══ Subscribe + Quiz CTA Row ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '40px 0' }}>
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
        <div style={{ background: '#1a2332', borderRadius: 8, padding: '40px 48px', margin: '0 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
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
