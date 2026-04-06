/**
 * GET /api/cron/refresh — Periodic data refresh (called by Vercel Cron)
 *
 * 1. Fetches all external APIs (FRED, BLS, World Bank, OECD, WHO, O*NET, AI Index)
 * 2. Computes normalized scores
 * 3. Stores results in Supabase:
 *    - composite_scores + sub_indexes (latest snapshot for homepage/dashboard)
 *    - monthly_scores (permanent monthly record for trend chart)
 *    - raw_data_points (immutable log)
 * 4. Triggers ISR revalidation so pages show fresh data
 *
 * Protected by CRON_SECRET to prevent unauthorized calls.
 * Vercel Cron sends this header automatically.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllRealData, computeScores } from '@/lib/realData'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // max for Vercel hobby plan

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends Authorization header for cron jobs)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 })
  }

  const sb = createClient(supabaseUrl, serviceRoleKey)
  const startTime = Date.now()

  try {
    // ── Step 1: Fetch all external APIs ──
    const { points, errors } = await fetchAllRealData()
    const computed = computeScores(points)

    if (computed.activeDomains === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No data sources returned results',
        errors,
        duration_ms: Date.now() - startTime,
      }, { status: 502 })
    }

    // ── Step 2: Compute delta from previous score ──
    let delta: number | null = null
    try {
      const { data: prevScores } = await sb
        .from('composite_scores')
        .select('score_value')
        .eq('score_type', 'composite')
        .order('computed_at', { ascending: false })
        .limit(1)

      if (prevScores && prevScores.length > 0) {
        delta = Math.round((computed.composite - prevScores[0].score_value) * 100) / 100
      }
    } catch {
      console.warn('Could not compute delta from previous score')
    }

    // ── Step 3: Store to composite_scores + sub_indexes ──
    const { data: scoreRow, error: scoreErr } = await sb
      .from('composite_scores')
      .insert({
        score_type: 'composite',
        score_value: computed.composite,
        band: computed.band,
        delta,
        computed_at: new Date().toISOString(),
        metadata: {
          cron: true,
          sources_connected: computed.sources_connected,
          sources_missing: computed.sources_missing,
          active_domains: computed.activeDomains,
          total_domains: computed.totalDomains,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
      .select('id')
      .single()

    if (scoreErr) throw new Error(`composite_scores insert failed: ${scoreErr.message}`)

    // Insert sub_indexes for each domain
    const subRows = Object.entries(computed.domains).map(([domain, info]) => ({
      composite_score_id: scoreRow.id,
      domain,
      value: info.score ?? null,
      weight: getWeight(domain),
      source_updated_at: info.hasData ? new Date().toISOString() : null,
      raw_data: {
        sources: info.sources,
        hasData: info.hasData,
        dataPoints: info.dataPoints,
      },
    }))

    const { error: subErr } = await sb.from('sub_indexes').insert(subRows)
    if (subErr) console.error('sub_indexes insert warning:', subErr.message)

    // ── Step 4: Store to monthly_scores (upsert current month) ──
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { error: monthErr } = await sb.from('monthly_scores').upsert({
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
      metadata: { cron: true },
    }, { onConflict: 'year_month' })

    if (monthErr) console.error('monthly_scores upsert warning:', monthErr.message)

    // ── Step 5: Store raw data points (append-only log) ──
    if (points.length > 0) {
      const rawRows = points.map(p => ({
        source: p.source,
        indicator: p.indicator,
        value: p.value,
        reference_date: p.period || now.toISOString().split('T')[0],
        fetched_at: p.fetched_at,
        payload: {
          domain: p.domain,
          normalized: p.normalized,
          series: p.series,
          context: p.context,
        },
      }))

      const { error: rawErr } = await sb.from('raw_data_points').insert(rawRows)
      if (rawErr) console.error('raw_data_points insert warning:', rawErr.message)
    }

    // ── Step 6: Trigger ISR revalidation ──
    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/pulse')
    revalidatePath('/layoffs')
    revalidatePath('/api/corporate-layoffs')

    const duration = Date.now() - startTime

    return NextResponse.json({
      ok: true,
      composite: computed.composite,
      band: computed.band,
      active_domains: computed.activeDomains,
      sources_connected: computed.sources_connected,
      sources_missing: computed.sources_missing,
      monthly_record: yearMonth,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: String(err),
      duration_ms: Date.now() - startTime,
    }, { status: 500 })
  }
}

const WEIGHTS: Record<string, number> = {
  work_risk: 0.25, inequality: 0.18, unrest: 0.15,
  decay: 0.12, wellbeing: 0.12, policy: 0.10, sentiment: 0.08,
}
function getWeight(domain: string): number {
  return WEIGHTS[domain] || 0.1
}
