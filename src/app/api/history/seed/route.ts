/**
 * POST /api/history/seed — Backfill historical monthly scores
 *
 * Computes scores for each of the past N months using FRED/BLS historical data,
 * then stores them in Supabase monthly_scores table.
 *
 * Query params:
 *   ?months=6  (default 6, max 12)
 *   ?force=true  (overwrite existing months, default false)
 *
 * This endpoint is idempotent: without ?force, it skips months already in the DB.
 * Protected by a simple secret check.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeMonthlyScore, getPastMonths } from '@/lib/historicalData'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // Allow up to 60s for backfill

export async function POST(request: Request) {
  // Use service role key for writes (anon key is read-only via RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  // Simple auth: require a seed secret or check for service role
  const seedSecret = process.env.HISTORY_SEED_SECRET
  const authHeader = request.headers.get('authorization')
  if (seedSecret && authHeader !== `Bearer ${seedSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const monthCount = Math.min(parseInt(searchParams.get('months') || '6', 10), 12)
  const force = searchParams.get('force') === 'true'

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const months = getPastMonths(monthCount)

  // Check which months already exist
  const { data: existing } = await supabase
    .from('monthly_scores')
    .select('year_month')
    .in('year_month', months)

  const existingSet = new Set((existing || []).map(r => r.year_month))

  const results: Array<{ month: string; status: string; composite?: number }> = []

  for (const ym of months) {
    if (!force && existingSet.has(ym)) {
      results.push({ month: ym, status: 'skipped (exists)' })
      continue
    }

    try {
      const score = await computeMonthlyScore(ym)

      const row = {
        year_month: score.year_month,
        composite: score.composite,
        band: score.band,
        work_risk: score.work_risk,
        inequality: score.inequality,
        unrest: score.unrest,
        decay: score.decay,
        wellbeing: score.wellbeing,
        policy: score.policy,
        sentiment: score.sentiment,
        active_domains: score.active_domains,
        sources_connected: score.sources_connected,
        computed_at: new Date().toISOString(),
        metadata: { backfill: true, computed_for: ym },
      }

      const { error } = await supabase
        .from('monthly_scores')
        .upsert(row, { onConflict: 'year_month' })

      if (error) throw error
      results.push({ month: ym, status: 'saved', composite: score.composite })
    } catch (err) {
      results.push({ month: ym, status: `error: ${err}` })
    }
  }

  return NextResponse.json({ ok: true, results })
}
