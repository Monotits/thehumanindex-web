import type { Metadata } from 'next'
import { MOCK_COMPOSITE_SCORE } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { CompositeScore, Commentary, Domain } from '@/lib/types'
import { fetchAllRealData, computeScores, fetchKeyStat } from '@/lib/realData'
import HomeRouter from '@/components/home/HomeRouter'

export const metadata: Metadata = {
  alternates: { canonical: 'https://thehumanindex.org' },
}

// ISR revalidation every 24 hours
export const revalidate = 86400

// Mock fallback values per domain
const MOCK_DOMAIN_SCORES: Record<string, number> = {
  work_risk: 72,
  inequality: 64,
  unrest: 51,
  decay: 43,
  wellbeing: 38,
  policy: 55,
  sentiment: 62,
}

const DOMAIN_WEIGHTS: Record<string, number> = {
  work_risk: 0.25,
  inequality: 0.18,
  unrest: 0.15,
  decay: 0.12,
  wellbeing: 0.12,
  policy: 0.10,
  sentiment: 0.08,
}

async function getLatestScore(): Promise<CompositeScore> {
  // 1. Try Supabase first
  try {
    const { data, error } = await supabase
      .from('composite_scores')
      .select('*, sub_indexes(*)')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) return data[0] as CompositeScore
  } catch (e) {
    console.error('Supabase score fetch failed:', e)
  }

  // 2. Try real data APIs (BLS, FRED, World Bank, OECD, ACLED)
  try {
    const { points } = await fetchAllRealData()
    if (points.length > 0) {
      const computed = computeScores(points, MOCK_DOMAIN_SCORES)

      // Build CompositeScore from real data
      const realScore: CompositeScore = {
        id: `real-${Date.now()}`,
        score_type: 'composite',
        score_value: computed.composite,
        band: computed.band as CompositeScore['band'],
        delta: null, // no delta without historical data
        computed_at: new Date().toISOString(),
        metadata: {
          sources_connected: computed.sources_connected,
          sources_missing: computed.sources_missing,
        },
        sub_indexes: Object.entries(computed.domains).map(([domain, info]) => ({
          id: `real-sub-${domain}`,
          composite_score_id: `real-${Date.now()}`,
          domain: domain as Domain,
          value: info.score,
          weight: DOMAIN_WEIGHTS[domain] || 0.1,
          source_updated_at: new Date().toISOString(),
          raw_data: { sources: info.sources },
        })),
      }

      console.log(`[THI] Real data score: ${computed.composite} | Sources: ${computed.sources_connected.join(', ')} | Missing: ${computed.sources_missing.join(', ')}`)
      return realScore
    }
  } catch (e) {
    console.error('Real data pipeline failed:', e)
  }

  // 3. Fall back to mock
  console.warn('[THI] Using mock data — no real sources available')
  return MOCK_COMPOSITE_SCORE
}

const PLACEHOLDER_PULSE: Commentary = {
  id: 'placeholder-pulse',
  type: 'weekly_pulse',
  title: 'Weekly Pulse Analysis Coming Soon',
  body_markdown: `# Weekly Pulse Analysis\n\nThe Human Index is now live and computing real scores from BLS, FRED, World Bank, and OECD data. Weekly AI-generated analysis reports will appear here as the index matures.\n\n## What to Expect\n\nEach week, this section will feature data-driven analysis covering shifts in employment, inequality, social unrest, institutional trust, and public sentiment — all derived from the live data powering the composite index.\n\n## In the Meantime\n\nExplore the dashboard for real-time domain scores, take the quiz to assess your personal AI displacement risk, or follow our social feeds for curated coverage from Reddit and major news outlets.`,
  composite_score_id: null,
  published_at: new Date().toISOString(),
  slug: 'coming-soon',
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
  return PLACEHOLDER_PULSE
}

export default async function Home() {
  const [score, pulse, keyStat] = await Promise.all([
    getLatestScore(),
    getLatestPulse(),
    fetchKeyStat(),
  ])

  return <HomeRouter score={score} pulse={pulse} keyStat={keyStat} />
}
