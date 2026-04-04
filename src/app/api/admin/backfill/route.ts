/**
 * GET /api/admin/backfill — Recalculate all historical monthly_scores
 *
 * Reads raw_data_points from Supabase, groups them by month,
 * re-runs computeScores() with the CURRENT algorithm, and upserts
 * the results back to monthly_scores.
 *
 * This fixes the "different algorithm over time" problem where
 * old months were scored with buggy normalization ranges or wrong
 * series IDs (e.g., Russia Gini).
 *
 * Protected by CRON_SECRET. Run once after algorithm changes.
 * Usage: curl -H "Authorization: Bearer <CRON_SECRET>" https://thehumanindex.org/api/admin/backfill
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeScores, DomainDataPoint } from '@/lib/realData'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 })
  }

  const sb = createClient(supabaseUrl, serviceRoleKey)

  try {
    // ── Step 1: Fetch ALL raw_data_points ──
    const { data: rawPoints, error: rawErr } = await sb
      .from('raw_data_points')
      .select('*')
      .order('fetched_at', { ascending: true })
      .limit(10000)

    if (rawErr) throw new Error(`Failed to read raw_data_points: ${rawErr.message}`)
    if (!rawPoints || rawPoints.length === 0) {
      return NextResponse.json({ ok: false, error: 'No raw_data_points found' })
    }

    // ── Step 2: Group by year-month ──
    const byMonth: Record<string, DomainDataPoint[]> = {}

    for (const row of rawPoints) {
      // Determine the month from fetched_at
      const fetchedAt = new Date(row.fetched_at)
      const ym = `${fetchedAt.getFullYear()}-${String(fetchedAt.getMonth() + 1).padStart(2, '0')}`

      if (!byMonth[ym]) byMonth[ym] = []

      const payload = row.payload as Record<string, unknown> || {}

      // Reconstruct DomainDataPoint from stored raw data
      // We need to RE-NORMALIZE with the current algorithm
      // But we only have raw values + domain info in payload
      byMonth[ym].push({
        domain: (payload.domain as string) || '',
        indicator: row.indicator || '',
        value: typeof row.value === 'number' ? row.value : parseFloat(row.value) || 0,
        normalized: typeof payload.normalized === 'number' ? payload.normalized : 0,
        source: row.source || '',
        series: (payload.series as string) || '',
        period: row.reference_date || '',
        fetched_at: row.fetched_at || '',
        context: (payload.context as string) || '',
      })
    }

    // ── Step 3: For each month, keep only the LATEST fetch per indicator ──
    // (cron may have run multiple times in a month)
    const monthResults: { yearMonth: string; composite: number; band: string; domains: Record<string, number | null> }[] = []

    for (const [ym, points] of Object.entries(byMonth)) {
      // Deduplicate: keep last occurrence of each indicator per domain
      const latestByKey: Record<string, DomainDataPoint> = {}
      for (const p of points) {
        const key = `${p.domain}::${p.indicator}`
        latestByKey[key] = p // later entries overwrite earlier ones
      }
      const dedupedPoints = Object.values(latestByKey)

      if (dedupedPoints.length === 0) continue

      // Re-compute scores with current algorithm
      const computed = computeScores(dedupedPoints)

      if (computed.activeDomains === 0) continue

      // Upsert to monthly_scores
      const { error: monthErr } = await sb.from('monthly_scores').upsert({
        year_month: ym,
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
        computed_at: new Date().toISOString(),
        metadata: { backfill: true, original_points: dedupedPoints.length },
      }, { onConflict: 'year_month' })

      if (monthErr) {
        console.error(`Backfill ${ym} failed:`, monthErr.message)
      } else {
        monthResults.push({
          yearMonth: ym,
          composite: computed.composite,
          band: computed.band,
          domains: Object.fromEntries(
            Object.entries(computed.domains).map(([d, info]) => [d, info.score])
          ),
        })
      }
    }

    // ── Step 4: Revalidate pages ──
    revalidatePath('/')
    revalidatePath('/dashboard')

    return NextResponse.json({
      ok: true,
      months_processed: monthResults.length,
      total_raw_points: rawPoints.length,
      results: monthResults.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
