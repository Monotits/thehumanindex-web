import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { CompositeScore, Commentary, Domain } from '@/lib/types'
import { fetchKeyStat } from '@/lib/realData'
import { MonthlyScore } from '@/lib/historicalData'
import HomeRouter from '@/components/home/HomeRouter'

export const metadata: Metadata = {
  alternates: { canonical: 'https://thehumanindex.org' },
}

// ISR: revalidate every 1 hour.
// Fresh data comes from the cron job (/api/cron/refresh) which runs daily
// and calls revalidatePath('/') after writing to the DB.
export const revalidate = 3600

const DOMAIN_WEIGHTS: Record<string, number> = {
  work_risk: 0.25,
  inequality: 0.18,
  unrest: 0.15,
  decay: 0.12,
  wellbeing: 0.12,
  policy: 0.10,
  sentiment: 0.08,
}

/**
 * Read latest score from Supabase (written by cron job).
 * No external API calls — all data comes from our DB cache.
 */
async function getLatestScore(): Promise<CompositeScore> {
  try {
    const { data, error } = await supabase
      .from('composite_scores')
      .select('*, sub_indexes(*)')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      console.log(`[THI] Loaded score from DB: ${data[0].score_value} (${data[0].band})`)
      return data[0] as CompositeScore
    }
  } catch (e) {
    console.error('Supabase score fetch failed:', e)
  }

  // No data in DB yet — return zero score
  console.warn('[THI] No cached scores in DB — run /api/cron/refresh to populate')
  return {
    id: 'no-data',
    score_type: 'composite',
    score_value: 0,
    band: 'low',
    delta: null,
    computed_at: new Date().toISOString(),
    metadata: {
      sources_connected: [],
      sources_missing: ['BLS', 'FRED', 'World Bank', 'OECD', 'O*NET', 'ACLED'],
      activeDomains: 0,
      totalDomains: 7,
    },
    sub_indexes: Object.keys(DOMAIN_WEIGHTS).map(domain => ({
      id: `empty-${domain}`,
      composite_score_id: 'no-data',
      domain: domain as Domain,
      value: 0,
      weight: DOMAIN_WEIGHTS[domain],
      source_updated_at: null,
      raw_data: { hasData: false, sources: [], dataPoints: [] },
    })),
  }
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

async function getTrendHistory(): Promise<MonthlyScore[]> {
  try {
    const { data, error } = await supabase
      .from('monthly_scores')
      .select('*')
      .order('year_month', { ascending: true })
      .limit(6)

    if (!error && data && data.length > 0) {
      return data.map(row => ({
        year_month: row.year_month,
        composite: Number(row.composite),
        band: row.band,
        work_risk: row.work_risk != null ? Number(row.work_risk) : null,
        inequality: row.inequality != null ? Number(row.inequality) : null,
        unrest: row.unrest != null ? Number(row.unrest) : null,
        decay: row.decay != null ? Number(row.decay) : null,
        wellbeing: row.wellbeing != null ? Number(row.wellbeing) : null,
        policy: row.policy != null ? Number(row.policy) : null,
        sentiment: row.sentiment != null ? Number(row.sentiment) : null,
        active_domains: row.active_domains,
        sources_connected: row.sources_connected || [],
      }))
    }
  } catch (e) {
    console.error('Failed to fetch trend history:', e)
  }
  return []
}

export default async function Home() {
  const [score, pulse, keyStat, trendHistory] = await Promise.all([
    getLatestScore(),
    getLatestPulse(),
    fetchKeyStat(),
    getTrendHistory(),
  ])

  return <HomeRouter score={score} pulse={pulse} keyStat={keyStat} trendHistory={trendHistory} />
}
