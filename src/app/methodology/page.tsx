'use client'

import { DOMAIN_LABELS, DOMAIN_ICONS, Domain } from '@/lib/types'
import { FAQPageJsonLd } from '@/components/JsonLd'
import { useTheme } from '@/lib/theme'

const FAQ_QUESTIONS = [
  { question: 'What is The Human Index?', answer: 'The Human Index is a real-time composite indicator that measures civilizational stress caused by AI-driven economic transformation across seven key domains.' },
  { question: 'How is the composite score calculated?', answer: 'The composite score is a weighted average of seven domain indices: AI Work Displacement Risk (25%), Income Inequality (18%), Social Unrest (15%), Institutional Decay (12%), Public Wellbeing (12%), Policy Response (10%), and Public Sentiment (8%).' },
  { question: 'What are the exposure bands?', answer: 'Scores are categorized into five bands: Low (0-25), Moderate (26-45), Elevated (46-65), High (66-80), and Critical (81-100). Each band indicates the severity of structural stress.' },
  { question: 'How often is the data updated?', answer: 'The Human Index is updated weekly with fresh data from public sources including the Bureau of Labor Statistics, O*NET, Federal Reserve, World Bank, CDC, and Pew Research Center.' },
  { question: 'What data sources does The Human Index use?', answer: 'Primary sources include BLS employment data, O*NET task-level analysis, Federal Reserve income distribution data, World Bank institutional metrics, CDC/SAMHSA wellbeing indicators, and Pew Research trust surveys.' },
]

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  work_risk: 'Tracks automation exposure of current jobs based on task decomposition, wage levels, and skill substitutability. Data sources: O*NET, Bureau of Labor Statistics, Glassdoor.',
  inequality: 'Measures income and wealth concentration, wage stagnation, and asset appreciation gaps. Data sources: World Inequality Database, IRS, Federal Reserve.',
  unrest: 'Monitors labor strikes, protests, and civic participation indicators. Data sources: IPSOS surveys, labor department filings, protest tracking.',
  decay: 'Tracks institutional trust, government effectiveness, and functional capacity. Data sources: Pew Research, World Bank, Congressional effectiveness metrics.',
  wellbeing: 'Measures mental health indicators, substance use, suicide rates, and life satisfaction. Data sources: CDC, SAMHSA, OECD.',
  policy: 'Assesses policy responsiveness to emerging displacement challenges. Data sources: Legislative tracking, regulation analysis, expert assessment.',
  sentiment: 'Analyzes public discourse and sentiment toward AI, technology, and economic systems. Data sources: Social media analysis, news sentiment, surveys.',
}

const WEIGHTS: Record<string, number> = {
  work_risk: 0.25, inequality: 0.18, unrest: 0.15, decay: 0.12, wellbeing: 0.12, policy: 0.10, sentiment: 0.08,
}

const BANDS = [
  { label: 'LOW', range: '0-25', color: '#22c55e', desc: 'Minimal structural stress. Institutional capacity strong, jobs relatively secure, income distribution stable.' },
  { label: 'MODERATE', range: '26-45', color: '#3b82f6', desc: 'Growing tensions emerging. Some job displacement beginning, policy lag evident, social cohesion fraying at edges.' },
  { label: 'ELEVATED', range: '46-65', color: '#f59e0b', desc: 'Significant stress indicators. Widespread displacement anxiety, institutional erosion, increasing social fragmentation.' },
  { label: 'HIGH', range: '66-80', color: '#ea580c', desc: 'Substantial system stress. Institutional failures emerging, large-scale displacement, social unrest widespread.' },
  { label: 'CRITICAL', range: '81-100', color: '#dc2626', desc: 'Structural transformation underway. System capacity overwhelmed, cascading failures across domains, irreversible change in progress.' },
]

const DATA_SOURCES = [
  'Bureau of Labor Statistics (BLS) — Employment data',
  'O*NET Database — Task-level job exposure analysis',
  'Federal Reserve — Income and wealth distribution',
  'World Bank — Institutional quality metrics',
  'CDC / SAMHSA — Mental health and wellbeing indicators',
  'Pew Research Center — Public sentiment and trust',
  'Labor Department — Strike and protest filings',
]

export default function MethodologyPage() {
  const { theme, themeId } = useTheme()
  const isBriefing = themeId === 'briefing'

  const sectionStyle: React.CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: themeId === 'terminal' ? 4 : 10,
    padding: '28px 32px',
    marginBottom: 24,
  }

  const h2Style: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: theme.text,
    fontFamily: theme.fontHeading,
    margin: '0 0 20px',
  }

  const pStyle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.7,
    color: theme.textSecondary,
    fontFamily: theme.fontBody,
    margin: '0 0 12px',
  }

  return (
    <div style={{ background: isBriefing ? '#f8f5f0' : theme.bg, minHeight: '100vh', paddingTop: 48, paddingBottom: 48 }}>
      <FAQPageJsonLd questions={FAQ_QUESTIONS} />
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: theme.text, fontFamily: theme.fontHeading, margin: '0 0 12px' }}>Methodology</h1>
          <p style={{ fontSize: 16, color: theme.textSecondary, fontFamily: theme.fontBody, lineHeight: 1.6 }}>
            How we measure civilization&apos;s proximity to irreversible AI-driven structural transformation
          </p>
        </div>

        {/* Overview */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Overview</h2>
          <p style={pStyle}>
            The Human Index combines seven distinct domain indices into a single Civilization Stress score. Each domain
            captures a critical aspect of societal stability in the face of transformative AI adoption.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Rather than speculating about future scenarios, we measure current real-world data points that correlate with
            structural fragility. Our methodology is transparent, reproducible, and updated weekly.
          </p>
        </div>

        {/* Seven Domains */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ ...h2Style, marginBottom: 24 }}>The Seven Domains</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(DOMAIN_LABELS).map(([key, label]) => {
              const domainKey = key as Domain
              return (
                <div key={key} style={sectionStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <span style={{ fontSize: 32, lineHeight: 1 }}>{DOMAIN_ICONS[domainKey]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: theme.text, margin: 0, fontFamily: theme.fontHeading }}>{label}</h3>
                        <span style={{
                          fontSize: 12,
                          color: theme.textTertiary,
                          background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontFamily: theme.fontMono,
                        }}>
                          {Math.round(WEIGHTS[key] * 100)}% weight
                        </span>
                      </div>
                      <p style={{ ...pStyle, marginBottom: 0 }}>{DOMAIN_DESCRIPTIONS[key]}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Band Definitions */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ ...h2Style, marginBottom: 24 }}>Exposure Bands</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BANDS.map(band => (
              <div key={band.label} style={{
                ...sectionStyle,
                borderLeft: `4px solid ${band.color}`,
                marginBottom: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: band.color }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0, fontFamily: theme.fontHeading }}>
                    {band.label} ({band.range})
                  </h3>
                </div>
                <p style={{ ...pStyle, marginBottom: 0, fontSize: 14 }}>{band.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Primary Data Sources</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DATA_SOURCES.map(src => (
              <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: theme.accent, fontWeight: 700, fontSize: 16 }}>•</span>
                <span style={{ fontSize: 14, color: theme.textSecondary, fontFamily: theme.fontBody }}>{src}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimers */}
        <div style={{
          ...sectionStyle,
          borderColor: '#92400e40',
          background: theme.isDark ? 'rgba(251, 191, 36, 0.04)' : 'rgba(251, 191, 36, 0.08)',
        }}>
          <h2 style={{ ...h2Style, fontSize: 17 }}>Important Disclaimers</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'The Human Index is based on model estimates and historical correlations. Future outcomes are inherently uncertain.',
              'Individual exposure scores are probabilistic estimates, not predictions. Many factors influence personal outcomes.',
              'This is not investment, career, or financial advice. Consult qualified professionals for personal decisions.',
              'Data is subject to revision as sources are updated. Historical scores may be recalculated with new information.',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, marginTop: 1 }}>⚠</span>
                <span style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, fontFamily: theme.fontBody }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
