import type { Metadata } from 'next'
import { DOMAIN_LABELS, DOMAIN_ICONS, Domain } from '@/lib/types'
import { FAQPageJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Methodology — How We Measure Civilizational Stress',
  description:
    'Learn how The Human Index measures AI displacement risk across seven domains: work risk, inequality, unrest, institutional decay, wellbeing, policy response, and public sentiment.',
  openGraph: {
    title: 'Methodology — The Human Index',
    description:
      'Transparent methodology behind the civilizational stress index. Seven domains, weighted composite scoring, updated weekly.',
  },
  alternates: { canonical: 'https://thehumanindex.org/methodology' },
}

const FAQ_QUESTIONS = [
  {
    question: 'What is The Human Index?',
    answer:
      'The Human Index is a real-time composite indicator that measures civilizational stress caused by AI-driven economic transformation across seven key domains.',
  },
  {
    question: 'How is the composite score calculated?',
    answer:
      'The composite score is a weighted average of seven domain indices: AI Work Displacement Risk (25%), Income Inequality (18%), Social Unrest (15%), Institutional Decay (12%), Public Wellbeing (12%), Policy Response (10%), and Public Sentiment (8%).',
  },
  {
    question: 'What are the exposure bands?',
    answer:
      'Scores are categorized into five bands: Low (0-25), Moderate (26-45), Elevated (46-65), High (66-80), and Critical (81-100). Each band indicates the severity of structural stress.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'The Human Index is updated weekly with fresh data from public sources including the Bureau of Labor Statistics, O*NET, Federal Reserve, World Bank, CDC, and Pew Research Center.',
  },
  {
    question: 'What data sources does The Human Index use?',
    answer:
      'Primary sources include BLS employment data, O*NET task-level analysis, Federal Reserve income distribution data, World Bank institutional metrics, CDC/SAMHSA wellbeing indicators, and Pew Research trust surveys.',
  },
]

export default function MethodologyPage() {
  return (
    <div className="bg-gray-950 min-h-screen py-12">
      <FAQPageJsonLd questions={FAQ_QUESTIONS} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Methodology</h1>
          <p className="text-gray-400 text-lg">
            How we measure civilization&apos;s proximity to irreversible AI-driven structural transformation
          </p>
        </div>

        {/* Overview */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-gray-400 mb-4">
            The Human Index combines seven distinct domain indices into a single Civilization Stress score. Each domain
            captures a critical aspect of societal stability in the face of transformative AI adoption.
          </p>
          <p className="text-gray-400">
            Rather than speculating about future scenarios, we measure current real-world data points that correlate with
            structural fragility. Our methodology is transparent, reproducible, and updated weekly.
          </p>
        </section>

        {/* Seven Domains */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">The Seven Domains</h2>
          <div className="space-y-6">
            {Object.entries(DOMAIN_LABELS).map(([key, label]) => {
              const domainKey = key as Domain
              const icon = DOMAIN_ICONS[domainKey]
              const weights: Record<string, number> = {
                work_risk: 0.25,
                inequality: 0.18,
                unrest: 0.15,
                decay: 0.12,
                wellbeing: 0.12,
                policy: 0.1,
                sentiment: 0.08,
              }

              return (
                <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white">{label}</h3>
                        <span className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                          {Math.round(weights[key] * 100)}% weight
                        </span>
                      </div>
                      {key === 'work_risk' && (
                        <p className="text-gray-400">
                          Tracks automation exposure of current jobs based on task decomposition, wage levels, and skill
                          substitutability. Data sources: O*NET, Bureau of Labor Statistics, Glassdoor.
                        </p>
                      )}
                      {key === 'inequality' && (
                        <p className="text-gray-400">
                          Measures income and wealth concentration, wage stagnation, and asset appreciation gaps. Data
                          sources: World Inequality Database, IRS, Federal Reserve.
                        </p>
                      )}
                      {key === 'unrest' && (
                        <p className="text-gray-400">
                          Monitors labor strikes, protests, and civic participation indicators. Data sources: IPSOS
                          surveys, labor department filings, protest tracking.
                        </p>
                      )}
                      {key === 'decay' && (
                        <p className="text-gray-400">
                          Tracks institutional trust, government effectiveness, and functional capacity. Data sources:
                          Pew Research, World Bank, Congressional effectiveness metrics.
                        </p>
                      )}
                      {key === 'wellbeing' && (
                        <p className="text-gray-400">
                          Measures mental health indicators, substance use, suicide rates, and life satisfaction. Data
                          sources: CDC, SAMHSA, OECD.
                        </p>
                      )}
                      {key === 'policy' && (
                        <p className="text-gray-400">
                          Assesses policy responsiveness to emerging displacement challenges. Data sources: Legislative
                          tracking, regulation analysis, expert assessment.
                        </p>
                      )}
                      {key === 'sentiment' && (
                        <p className="text-gray-400">
                          Analyzes public discourse and sentiment toward AI, technology, and economic systems. Data
                          sources: Social media analysis, news sentiment, surveys.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Band Definitions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">Exposure Bands</h2>
          <div className="space-y-4">
            <div className="bg-gray-900 border border-green-900/50 rounded-lg p-6 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <h3 className="font-bold text-white">LOW (0-25)</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Minimal structural stress. Institutional capacity strong, jobs relatively secure, income distribution
                stable.
              </p>
            </div>
            <div className="bg-gray-900 border border-blue-900/50 rounded-lg p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <h3 className="font-bold text-white">MODERATE (26-45)</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Growing tensions emerging. Some job displacement beginning, policy lag evident, social cohesion fraying
                at edges.
              </p>
            </div>
            <div className="bg-gray-900 border border-amber-900/50 rounded-lg p-6 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <h3 className="font-bold text-white">ELEVATED (46-65)</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Significant stress indicators. Widespread displacement anxiety, institutional erosion, increasing social
                fragmentation.
              </p>
            </div>
            <div className="bg-gray-900 border border-orange-900/50 rounded-lg p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <h3 className="font-bold text-white">HIGH (66-80)</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Substantial system stress. Institutional failures emerging, large-scale displacement, social unrest
                widespread.
              </p>
            </div>
            <div className="bg-gray-900 border border-red-900/50 rounded-lg p-6 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <h3 className="font-bold text-white">CRITICAL (81-100)</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Structural transformation underway. System capacity overwhelmed, cascading failures across domains,
                irreversible change in progress.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">Primary Data Sources</h2>
          <ul className="space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>Bureau of Labor Statistics (BLS) - Employment data</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>O*NET Database - Task-level job exposure analysis</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>Federal Reserve - Income and wealth distribution</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>World Bank - Institutional quality metrics</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>CDC / SAMHSA - Mental health and wellbeing indicators</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>Pew Research Center - Public sentiment and trust</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>Labor Department - Strike and protest filings</span>
            </li>
          </ul>
        </section>

        {/* Disclaimers */}
        <section className="bg-gray-900 border border-yellow-900/50 rounded-lg p-8">
          <h2 className="text-lg font-bold text-white mb-4">Important Disclaimers</h2>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex gap-3">
              <span className="text-yellow-500 font-bold mt-1">⚠</span>
              <span>
                The Human Index is based on model estimates and historical correlations. Future outcomes are inherently
                uncertain.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-500 font-bold mt-1">⚠</span>
              <span>
                Individual exposure scores are probabilistic estimates, not predictions. Many factors influence personal
                outcomes.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-500 font-bold mt-1">⚠</span>
              <span>
                This is not investment, career, or financial advice. Consult qualified professionals for personal
                decisions.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-500 font-bold mt-1">⚠</span>
              <span>
                Data is subject to revision as sources are updated. Historical scores may be recalculated with new
                information.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
