'use client'

import { useEffect, useState } from 'react'
import { QuizResult } from '@/lib/types'
import { ShareCard } from '@/components/ShareCard'
import { BandLabel } from '@/components/BandLabel'
import { useTheme } from '@/lib/theme'
import SubscribeForm from '@/components/SubscribeForm'

export default function ResultPage() {
  const { theme } = useTheme()
  const [result, setResult] = useState<QuizResult | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(true)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('quizResult')
    if (stored) {
      setResult(JSON.parse(stored))
      sessionStorage.removeItem('quizResult')
    } else {
      setResult({
        id: 'result-1',
        exposure_band: 'elevated',
        percentile: 65,
        percentile_label: '65th percentile',
        top_tasks_at_risk: [
          { task: 'Data analysis and reporting', exposure: 0.78 },
          { task: 'Excel and spreadsheet modeling', exposure: 0.72 },
          { task: 'Report writing and documentation', exposure: 0.68 },
        ],
        skill_recommendations: [
          { skill: 'AI Collaboration & Prompt Engineering', reason: 'Workers who can direct AI tools effectively command 23% salary premiums over peers who cannot.', course_url: '' },
          { skill: 'Systems Thinking & Complex Problem Solving', reason: 'AI excels at narrow tasks but struggles with interconnected systems. This skill makes you irreplaceable.', course_url: '' },
          { skill: 'Strategic Communication', reason: 'Persuading humans, building consensus, and navigating politics remain distinctly human capabilities.', course_url: '' },
        ],
        region_context: { unemployment_rate: 3.8, tech_industry_concentration: 'High', ai_adoption_speed: 'Accelerating' },
        share_card_data: { band: 'ELEVATED', percentile_text: '65th percentile', job_title: 'Data Analyst', region: 'San Francisco, CA' },
      })
    }
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      setShowEmailModal(false)
    } finally {
      setLoading(false)
    }
  }

  if (!result) return <div style={{ background: theme.bg, minHeight: '100vh' }} />

  const cardStyle: React.CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: 12,
    padding: 32,
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: theme.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
    fontFamily: theme.fontBody,
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, padding: '48px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 16, fontFamily: theme.fontHeading }}>Your Results</h1>
          <p style={{ fontSize: 16, color: theme.textSecondary, fontFamily: theme.fontBody }}>
            Based on your job, skills, and region, here&apos;s your AI exposure assessment.
          </p>
        </div>

        {/* Email Modal Overlay */}
        {showEmailModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 32, maxWidth: 420, width: '100%' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 16, fontFamily: theme.fontHeading }}>Get Your Full Report</h2>
              <p style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 24, lineHeight: 1.6, fontFamily: theme.fontBody }}>
                Enter your email to download your complete assessment with personalized career recommendations.
              </p>
              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '10px 16px', background: theme.bg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, color: theme.text, fontSize: 14, fontFamily: theme.fontBody, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
                  required
                />
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 0', background: theme.accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontBody, marginBottom: 8 }}>
                  {loading ? 'Sending...' : 'Get My Report'}
                </button>
                <button type="button" onClick={() => setShowEmailModal(false)} style={{ width: '100%', padding: '10px 0', background: theme.bg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, color: theme.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: theme.fontBody }}>
                  Skip for Now
                </button>
              </form>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
          {/* Main Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Exposure Band */}
            <div style={cardStyle}>
              <div style={sectionTitle}>Exposure Band</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: theme.textTertiary, margin: '0 0 8px', fontFamily: theme.fontBody }}>You&apos;re in the</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: theme.text, margin: '0 0 4px', fontFamily: theme.fontHeading }}>{result.percentile_label}</p>
                  <p style={{ fontSize: 13, color: theme.textTertiary, margin: 0, fontFamily: theme.fontBody }}>for your role and region</p>
                </div>
                <BandLabel band={result.exposure_band} size="lg" />
              </div>
            </div>

            {/* Tasks at Risk */}
            <div style={cardStyle}>
              <div style={sectionTitle}>Top Tasks at Risk</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {result.top_tasks_at_risk.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: theme.text, fontFamily: theme.fontBody }}>{item.task}</span>
                      <span style={{ fontSize: 13, color: theme.textTertiary, fontFamily: theme.fontBody }}>{Math.round(item.exposure * 100)}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: theme.isDark ? '#1a1a1a' : '#eee', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${item.exposure * 100}%`, height: '100%', background: theme.accent, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Recommendations */}
            <div style={cardStyle}>
              <div style={sectionTitle}>Skill Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {result.skill_recommendations.map((rec, idx) => (
                  <div key={idx} style={{ borderBottom: idx < result.skill_recommendations.length - 1 ? `1px solid ${theme.surfaceBorder}` : 'none', paddingBottom: idx < result.skill_recommendations.length - 1 ? 20 : 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, margin: '0 0 8px', fontFamily: theme.fontHeading }}>{rec.skill}</h3>
                    <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 10px', lineHeight: 1.5, fontFamily: theme.fontBody }}>{rec.reason}</p>
                    {/* Course links will be added when learning partner integrations are live */}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ ...cardStyle, background: `${theme.accent}10`, borderColor: `${theme.accent}30`, textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: '0 0 8px', fontFamily: theme.fontHeading }}>Stay Ahead of the Curve</h3>
              <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 20px', fontFamily: theme.fontBody }}>
                Get weekly updates on how AI displacement is evolving — and what it means for your career.
              </p>
              <div style={{ maxWidth: 380, margin: '0 auto' }}>
                <SubscribeForm />
              </div>
            </div>
          </div>

          {/* Share Card Sidebar */}
          <div>
            <div style={{ position: 'sticky', top: 96 }}>
              <ShareCard result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
