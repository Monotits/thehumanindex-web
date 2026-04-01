'use client'

import { DOMAIN_LABELS, Domain } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { FAQPageJsonLd } from '@/components/JsonLd'
import { useTheme } from '@/lib/theme'

const FAQ_QUESTIONS = [
  { question: 'What is The Human Index?', answer: 'The Human Index is a real-time composite indicator that measures civilizational stress caused by AI-driven economic transformation across seven key domains.' },
  { question: 'How is the composite score calculated?', answer: 'The composite score is a weighted average of seven domain indices: AI Work Displacement Risk (25%), Income Inequality (18%), Social Unrest (15%), Institutional Decay (12%), Public Wellbeing (12%), Policy Response (10%), and Public Sentiment (8%).' },
  { question: 'What are the exposure bands?', answer: 'Scores are categorized into five bands: Low (0-25), Moderate (26-45), Elevated (46-65), High (66-80), and Critical (81-100). Each band indicates the severity of structural stress.' },
  { question: 'How often is the data updated?', answer: 'The Human Index is updated daily with live data from 10+ sources including BLS, FRED, World Bank, OECD, WHO, V-Dem governance indicators, and O*NET occupational data. Layoff data from WARN Act filings is updated daily. Sentiment data is refreshed hourly from Reddit and RSS feeds. AI Index data is updated annually.' },
  { question: 'What data sources does The Human Index use?', answer: 'Connected sources: BLS (unemployment), FRED (jobless claims, savings rate, consumer sentiment, Gini, treasury spread, debt/GDP), World Bank/V-Dem (governance, corruption, rule of law, political stability, inequality), OECD (life satisfaction, trust in government, voter turnout), WHO (suicide rate, life expectancy, alcohol consumption), O*NET (hot technologies, bright outlook occupations, AI-related occupations), Stanford AI Index (AI investment, enterprise adoption), WARN Act Firehose (federal layoff filings), Reddit/RSS (public discourse). ACLED integration pending.' },
]

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  work_risk: 'Tracks AI-driven work displacement through unemployment rates, jobless claims, occupational disruption signals, corporate AI investment, and enterprise adoption rates. Sources: BLS, FRED (ICSA), O*NET (Hot Technologies, Bright Outlook, AI Occupations), Stanford AI Index.',
  inequality: 'Measures income and wealth concentration via Gini coefficients and income distribution. Sources: FRED (Census Gini), World Bank (Gini, Income Share Top 10%).',
  unrest: 'Monitors social tension through political stability indices and civic engagement metrics. Sources: World Bank/V-Dem (Political Stability), OECD (Voter Turnout). ACLED integration pending.',
  decay: 'Tracks institutional effectiveness, democratic quality, corruption, and rule of law. Sources: World Bank/V-Dem WGI (Government Effectiveness, Voice & Accountability, Rule of Law, Control of Corruption), FRED (Treasury Spread), OECD (Trust in Government).',
  wellbeing: 'Measures life satisfaction, health outcomes, financial security, and substance use. Sources: OECD (Life Satisfaction), FRED (Personal Saving Rate), WHO (Suicide Rate, Life Expectancy, Alcohol Consumption), World Bank (Suicide Rate, Life Expectancy).',
  policy: 'Assesses fiscal sustainability and government spending responsiveness. Sources: FRED (Federal Debt as % GDP, Government Social Benefits).',
  sentiment: 'Analyzes consumer confidence and public economic outlook. Sources: FRED (U. Michigan Consumer Sentiment, OECD Consumer Confidence), Reddit/RSS (layoff tracking, public discourse).',
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
  'Bureau of Labor Statistics (BLS) — Unemployment rate, labor market data',
  'Federal Reserve Economic Data (FRED) — Jobless claims, Gini, savings rate, consumer sentiment, treasury spread, debt/GDP',
  'World Bank / V-Dem (WGI) — Gini index, governance effectiveness, rule of law, corruption, political stability',
  'OECD — Life satisfaction, trust in government, voter turnout',
  'WHO Global Health Observatory — Suicide rate, life expectancy, alcohol consumption',
  'O*NET Center — Hot technologies, bright outlook occupations, AI-related occupations',
  'Stanford AI Index — Corporate AI investment, enterprise adoption rate (annual)',
  'WARN Act Firehose — Federal layoff filings (Worker Adjustment and Retraining Notification)',
  'Reddit / RSS — Layoff tracking, public sentiment from 7 subreddits + 5 news feeds',
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
                    <DomainIcon domain={domainKey} size={28} color={theme.accent} />
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
