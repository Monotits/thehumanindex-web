/**
 * POST /api/history/seed — Backfill historical monthly scores
 *
 * Computes score for ONE month at a time (to stay within Vercel timeout).
 *
 * Query params:
 *   ?month=2025-11   (required — single year-month to compute)
 *   ?force=true      (overwrite if exists, default false)
 *
 * To seed multiple months, call this endpoint once per month:
 *   for (const m of ['2025-11','2025-12','2026-01','2026-02','2026-03','2026-04']) {
 *     await fetch(`/api/history/seed?month=${m}`, { method: 'POST' })
 *   }
 *
 * This endpoint is idempotent: without ?force, it skips months already in the DB.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeMonthlyScore, getPastMonths } from '@/lib/historicalData'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function POST(request: Request) {
  // Auth check — admin-only endpoint
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const force = searchParams.get('force') === 'true'

  // If no month specified, return the list of months that need seeding
  if (!month) {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const months = getPastMonths(6)
    const { data: existing } = await supabase
      .from('monthly_scores')
      .select('year_month')
      .in('year_month', months)

    const existingSet = new Set((existing || []).map(r => r.year_month))
    const missing = months.filter(m => !existingSet.has(m))

    return NextResponse.json({
      ok: true,
      message: 'Pass ?month=YYYY-MM to seed a specific month. Missing months listed below.',
      all_months: months,
      existing: months.filter(m => existingSet.has(m)),
      missing,
      hint: `Run in browser console:\nfor (const m of ${JSON.stringify(missing)}) { await fetch('/api/history/seed?month=' + m, { method: 'POST' }).then(r => r.json()).then(console.log) }`,
    })
  }

  // Validate month format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid month format. Use YYYY-MM (e.g. 2025-11)' },
      { status: 400 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Check if already exists
  if (!force) {
    const { data: existing } = await supabase
      .from('monthly_scores')
      .select('year_month')
      .eq('year_month', month)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        ok: true,
        month,
        status: 'skipped (already exists)',
        hint: 'Use ?force=true to overwrite',
      })
    }
  }

  try {
    const score = await computeMonthlyScore(month)

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
      metadata: { backfill: true, computed_for: month },
    }

    const { error } = await supabase
      .from('monthly_scores')
      .upsert(row, { onConflict: 'year_month' })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      month,
      status: 'saved',
      composite: score.composite,
      band: score.band,
      active_domains: score.active_domains,
      sources: score.sources_connected,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, month, error: String(err) },
      { status: 500 }
    )
  }
}
