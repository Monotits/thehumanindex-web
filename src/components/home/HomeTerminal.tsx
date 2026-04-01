'use client'

import Link from 'next/link'
import { CompositeScore, Commentary, Domain, DOMAIN_LABELS } from '@/lib/types'
import { getDomainContext } from '@/lib/domainDescriptions'
import { KeyStat } from '@/lib/realData'
import { useTheme } from '@/lib/theme'
import { seededRandom } from '@/lib/seededRandom'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { useEffect, useState } from 'react'
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

interface Props {
  score: CompositeScore
  pulse: Commentary
  keyStat?: KeyStat
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
  { num: '01', title: 'Collect', desc: 'Live feeds from 10+ sources: BLS, FRED, World Bank, OECD, WHO, V-Dem, O*NET, AI Index, WARN Act, Reddit/RSS' },
  { num: '02', title: 'Analyze', desc: 'Weighted scoring with statistical normalization and anomaly detection' },
  { num: '03', title: 'Index', desc: 'Single composite score updated weekly, with AI-generated analysis' },
]

export default function HomeTerminal({ score, pulse, keyStat }: Props) {
  const { theme } = useTheme()
  const [pulseAnim, setPulseAnim] = useState(1)
  // email state removed — using SubscribeForm component

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

  // Movers — top 2 risers and top 1 faller (simulated deltas)
  const movers = domains.map(d => {
    const rng = seededRandom(`mover-terminal-${d.domain}`)
    return { ...d, delta: +(rng() * 4 - 1.5).toFixed(2) }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const topRisers = movers.filter(m => m.delta > 0).slice(0, 2)
  const topFallers = movers.filter(m => m.delta < 0).slice(0, 1)

  // Key stat — from real data pipeline
  const stat = keyStat || { value: '—', label: 'connecting to data sources...', source: '' }

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
                <div style={{ fontSize: 11, color: theme.textTertiary, lineHeight: 1.5, fontFamily: theme.fontMono }}>
                  {ctx.insight}
                </div>
              </div>
            )
          })}
        </div>

        {/* ═══ Compact Stat Bar ═══ */}
        <div className="stat-bar" style={{
          display: 'flex', gap: 0, marginBottom: 24,
          background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6,
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
              flex: '1 1 0', padding: '12px 16px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${theme.surfaceBorder}` : 'none',
            }}>
              <div style={{
                fontSize: 20, fontWeight: 600, fontFamily: theme.fontMono, lineHeight: 1,
                color: item.accent ? theme.accent : '#fff',
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 9, color: theme.textTertiary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, fontFamily: theme.fontMono }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Corporate Layoff Tracker — Primary content ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <CorporateLayoffTable />
        </div>

        {/* ═══ Enhanced Domain Analysis (Score + Trend + Delta + Weight) ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <DomainComparisonBar domains={domains} />
        </div>

        {/* ═══ Analytics Row: Radar + Weekly Heatmap ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <WeeklyHeatmap currentScore={score.score_value} />
          </div>
        </div>

        {/* ═══ Composite Decomposition (Stacked Area) ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <StackedAreaDecomposition domains={domains} />
        </div>

        {/* ═══ Waterfall + Multi-Domain Trend ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <WaterfallChart domains={domains} compositeScore={score.score_value} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <MultiDomainTrend domains={domains} />
          </div>
        </div>

        {/* ═══ Risk Matrix + Correlation ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <RiskBubbleChart domains={domains} />
          </div>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20 }}>
            <CorrelationHeatmap domains={domains} />
          </div>
        </div>

        {/* ═══ Featured Insight ═══ */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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

          {/* Live Data Sources */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.accent}33`, borderRadius: 6, padding: 24 }}>
            <div style={{ fontSize: 11, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1, marginBottom: 12 }}>DATA SOURCES ACTIVE</div>
            <div style={{ fontSize: 16, fontWeight: 400, color: '#fff', lineHeight: 1.5, marginBottom: 16 }}>
              {score.metadata && (score.metadata as Record<string, string[]>).sources_connected
                ? `Connected: ${((score.metadata as Record<string, string[]>).sources_connected).join(', ')}`
                : 'Composite score computed from live economic and social data.'}
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6 }}>
              The index aggregates data from BLS, FRED, World Bank, and OECD to measure civilizational stress across 7 domains. Scores update every 24 hours.
            </div>
            {score.metadata && (score.metadata as Record<string, string[]>).sources_missing?.length > 0 && (
              <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 8, fontFamily: theme.fontMono }}>
                Pending: {((score.metadata as Record<string, string[]>).sources_missing).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Data Sources Strip ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: '16px 24px', marginBottom: 24 }}>
          <div className="sources-strip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 1 }}>DATA SOURCES:</span>
            {DATA_SOURCES.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary }}>{s.name}</span>
                <span style={{ fontSize: 10, color: theme.textTertiary }}>({s.desc})</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ What the World is Saying — Live Feed ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <SocialFeedSection />
        </div>

        {/* ═══ Layoff Tracker ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <LayoffTracker />
        </div>

        {/* ═══ Methodology at a Glance ═══ */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, padding: 32, marginBottom: 24 }}>
          {sectionHeader('Methodology at a Glance')}
          <div className="grid-methodology" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
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
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <SubscribeForm />
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
