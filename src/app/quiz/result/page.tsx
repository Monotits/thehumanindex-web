'use client'

import { useEffect, useState } from 'react'
import { QuizResult } from '@/lib/types'
import { ShareCard } from '@/components/ShareCard'
import { BandLabel } from '@/components/BandLabel'

export default function ResultPage() {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(true)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Try to load from session storage first, fall back to mock data
    const stored = sessionStorage.getItem('quizResult')
    if (stored) {
      setResult(JSON.parse(stored))
      sessionStorage.removeItem('quizResult')
    } else {
      // Mock result for demo
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
          {
            skill: 'Prompt Engineering',
            reason: 'Critical for working effectively with AI systems',
            course_url: 'https://example.com',
          },
          {
            skill: 'Systems Thinking',
            reason: 'Higher-order skills AI struggles with',
            course_url: 'https://example.com',
          },
          {
            skill: 'Strategic Communication',
            reason: 'Leadership and influence remain distinctly human',
            course_url: 'https://example.com',
          },
        ],
        region_context: {
          unemployment_rate: 3.8,
          tech_industry_concentration: 'High',
          ai_adoption_speed: 'Accelerating',
        },
        share_card_data: {
          band: 'ELEVATED',
          percentile_text: '65th percentile',
          job_title: 'Data Analyst',
          region: 'San Francisco, CA',
        },
      })
    }
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // For now just close the modal, in production this would save to a list
      setShowEmailModal(false)
    } finally {
      setLoading(false)
    }
  }

  if (!result) return <div className="bg-gray-950 min-h-screen" />

  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Your Results</h1>
          <p className="text-gray-400">
            Based on your job, skills, and region, here&apos;s your AI exposure assessment.
          </p>
        </div>

        {/* Email Modal Overlay */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Get Your Full Report</h2>
              <p className="text-gray-400 mb-6">
                Enter your email to download your complete assessment with personalized career recommendations.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Sending...' : 'Get My Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Skip for Now
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-8">
            {/* Exposure Band */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-lg font-semibold text-gray-400 mb-4">EXPOSURE BAND</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">You&apos;re in the</p>
                  <p className="text-white text-2xl font-bold mb-1">{result.percentile_label}</p>
                  <p className="text-gray-500 text-sm">for your role and region</p>
                </div>
                <BandLabel band={result.exposure_band} size="lg" />
              </div>
            </div>

            {/* Tasks at Risk */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-lg font-semibold text-gray-400 mb-6">TOP TASKS AT RISK</h2>
              <div className="space-y-4">
                {result.top_tasks_at_risk.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-sm">{item.task}</span>
                      <span className="text-gray-400 text-sm font-mono">{Math.round(item.exposure * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${item.exposure * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Recommendations */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-lg font-semibold text-gray-400 mb-6">SKILL RECOMMENDATIONS</h2>
              <div className="space-y-6">
                {result.skill_recommendations.map((rec, idx) => (
                  <div key={idx} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-white font-semibold mb-2">{rec.skill}</h3>
                    <p className="text-gray-400 text-sm mb-3">{rec.reason}</p>
                    {rec.course_url && (
                      <a
                        href={rec.course_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                      >
                        Find Courses →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-8 text-center">
              <h3 className="text-white font-bold mb-2">Download the App</h3>
              <p className="text-gray-400 mb-4">
                Get your full personalized report with detailed career roadmap and continuous exposure monitoring.
              </p>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Download Now
              </button>
            </div>
          </div>

          {/* Share Card Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ShareCard result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
