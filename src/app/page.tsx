import type { Metadata } from 'next'
import Link from 'next/link'
import { CompositeGauge } from '@/components/CompositeGauge'
import { SubIndexBar } from '@/components/SubIndexBar'
import { MOCK_COMPOSITE_SCORE, MOCK_COMMENTARIES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import { CompositeScore, Commentary } from '@/lib/types'

export const metadata: Metadata = {
  alternates: { canonical: 'https://thehumanindex.org' },
}

// ISR revalidation every 24 hours
export const revalidate = 86400

async function getLatestScore(): Promise<CompositeScore> {
  try {
    const { data, error } = await supabase
      .from('composite_scores')
      .select('*, sub_indexes(*)')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1)

    if (error) throw error
    if (data && data.length > 0) return data[0] as CompositeScore
  } catch (e) {
    console.error('Failed to fetch score:', e)
  }
  return MOCK_COMPOSITE_SCORE
}

async function getLatestPulse(): Promise<Commentary> {
  try {
    const { data, error } = await supabase
      .from('commentary')
      .select('*')
      .eq('type', 'weekly_pulse')
      .order('published_at', { ascending: false })
      .limit(1)

    if (error) throw error
    if (data && data.length > 0) return data[0] as Commentary
  } catch (e) {
    console.error('Failed to fetch pulse:', e)
  }
  return MOCK_COMMENTARIES[0]
}

export default async function Home() {
  const [score, latestPulse] = await Promise.all([
    getLatestScore(),
    getLatestPulse(),
  ])

  return (
    <div className="bg-gray-950 min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            The Human Index
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Tracking civilization&apos;s proximity to irreversible AI-driven structural transformation
          </p>
          <Link
            href="/quiz"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            How exposed is your job?
          </Link>
        </div>

        {/* Composite Gauge */}
        <div className="flex justify-center mb-16">
          <CompositeGauge score={score} />
        </div>
      </section>

      {/* Domains Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-white mb-12">Seven Domains of Civilizational Stress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {score.sub_indexes?.map(subIndex => (
            <div key={subIndex.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <SubIndexBar subIndex={subIndex} />
            </div>
          ))}
        </div>
      </section>

      {/* Latest Pulse Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-white mb-8">Latest Weekly Pulse</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">{latestPulse.title}</h3>
            <span className="text-sm text-gray-500">{timeAgo(latestPulse.published_at)}</span>
          </div>
          <p className="text-gray-400 mb-6 line-clamp-3">
            {latestPulse.body_markdown.split('\n').find(line => !line.startsWith('#') && line.trim())}
          </p>
          <Link
            href={`/pulse/${latestPulse.slug}`}
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
          >
            Read Full Analysis →
          </Link>
        </div>
      </section>

      {/* What is THI Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">What is The Human Index?</h2>
            <p className="text-gray-400 mb-4">
              The Human Index is a real-time monitor of civilization&apos;s structural stability in the face of AI-driven
              economic transformation. We synthesize data across seven key domains to provide a unified stress indicator.
            </p>
            <p className="text-gray-400 mb-6">
              Unlike traditional economic indices, THI captures the softer signals: job displacement anxiety, income
              polarization, institutional trust erosion, and social cohesion metrics.
            </p>
            <Link
              href="/methodology"
              className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
            >
              Learn Our Methodology →
            </Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 space-y-4">
            <div>
              <h4 className="font-bold text-white mb-2">Updated Weekly</h4>
              <p className="text-sm text-gray-400">Fresh data and analysis every Monday</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">AI-Powered Analysis</h4>
              <p className="text-sm text-gray-400">Claude interprets cross-domain patterns</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Evidence-Based</h4>
              <p className="text-sm text-gray-400">Built on public data and academic research</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">No Nonsense</h4>
              <p className="text-sm text-gray-400">Clear methodology, realistic estimates</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
