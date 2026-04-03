import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { CompositeScore, Commentary, Domain } from '@/lib/types'
import { fetchAllRealData, computeScores, fetchKeyStat, ComputedScores } from '@/lib/realData'
import { MonthlyScore } from '@/lib/historicalData'
import HomeRouter from '@/components/home/HomeRouter'

export const metadata: Metadata = {
  alternates: { canonical: 'https://thehumanindex.org' },
}

// ISR revalidation every 6 hours (ensures data stays reasonably fresh)
export const revalidate = 21600

const DOMAIN_WEIGHTS: Record<string, number> = {
  work_risk: 0.25,
  inequality: 0.18,
  unrest: 0.15,
  decay: 0.12,
  wellbeing: 0.12,
  policy: 0.10,
  sentiment: 0.08,
}

/** Save current month's score to monthly_scores table (fire-and-forget) */
async function storeMonthlyScore(computed: ComputedScores) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return

  try {
    const sb = createClient(supabaseUrl, serviceRoleKey)
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    await sb.from('monthly_scores').upsert({
      year_month: yearMonth,
      composite: computed.composite,
      band: computed.band,
      work_risk: computed.domains.work_risk?.score ?? null,
      inequality: computed.domains.inequality?.score ?? null,
      unrest: computed.domains.unrest?.score ?? null,
      decay: computed.domains.decay?.score ?? null,
      wellbeing: computed.domains.wellbeing?.score ?? null,
      policy: computed.domains.policy?.score ?? null,
      sentiment: computed.domains.sentiment?.score ?? null,
      active_domains: computed.activeDomains,
      sources_connected: computed.sources_connected,
      computed_at: now.toISOString(),
      metadata: { auto_stored: true },
    }, { onConflict: 'year_month' })

    console.log(`[THI] Stored monthly score for ${yearMonth}: ${computed.composite}`)
  } catch (e) {
    console.error('[THI] Failed to store monthly score:', e)
  }
}

async function getLatestScore(): Promise<CompositeScore> {
  // 1. ALWAYS compute from real data APIs first (BLS, FRED, World Bank, OECD, WHO, etc.)
  //    This ensures the v3 algorithm with proper normalization is always used.
  //    Supabase is only a fallback if ALL real sources fail.
  try {
    const { points } = await fetchAllRealData()
    const computed = computeScores(points)

    // Only use real data if we got at least 1 domain's data
    if (computed.activeDomains > 0) {
      const realScore: CompositeScore = {
        id: `real-${Date.now()}`,
        score_type: 'composite',
        score_value: computed.composite,
        band: computed.band as CompositeScore['band'],
        delta: null,
        computed_at: new Date().toISOString(),
        metadata: {
          sources_connected: computed.sources_connected,
          sources_missing: computed.sources_missing,
          activeDomains: computed.activeDomains,
          totalDomains: computed.totalDomains,
        },
        sub_indexes: Object.entries(computed.domains).map(([domain, info]) => ({
          id: `real-sub-${domain}`,
          composite_score_id: `real-${Date.now()}`,
          domain: domain as Domain,
          value: info.score ?? 0,
          weight: DOMAIN_WEIGHTS[domain] || 0.1,
          source_updated_at: new Date().toISOString(),
          raw_data: {
            sources: info.sources,
            hasData: info.hasData,
            dataPoints: info.dataPoints,
          },
        })),
      }

      console.log(`[THI] Score: ${computed.composite} (${computed.band}) | Active: ${computed.activeDomains}/${computed.totalDomains} | Sources: ${computed.sources_connected.join(', ')}`)

      // Auto-store this month's score (fire-and-forget, don't block rendering)
      storeMonthlyScore(computed).catch(() => {})

      return realScore
    }
  } catch (e) {
    console.error('Real data pipeline failed:', e)
  }

  // 2. Fallback to Supabase ONLY if real data produced nothing
  try {
    const { data, error } = await supabase
      .from('composite_scores')
      .select('*, sub_indexes(*)')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      console.log('[THI] Using Supabase fallback (real data unavailable)')
      return data[0] as CompositeScore
    }
  } catch (e) {
    console.error('Supabase score fetch failed:', e)
  }

  // 3. No data available — return zero score with clear indication
  console.warn('[THI] No data sources available')
  return {
    id: 'no-data',
    score_type: 'composite',
    score_value: 0,
    band: 'low',
    delta: null,
    computed_at: new Date().toISOString(),
    metadata: { sources_connected: [], sources_missing: ['BLS', 'FRED', 'World Bank', 'OECD', 'O*NET', 'ACLED'], activeDomains: 0, totalDomains: 7 },
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
