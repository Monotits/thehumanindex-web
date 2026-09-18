/**
 * GET /api/data — public dataset endpoint
 *
 * Default: latest composite + 5 meta-index scores for every tracked country
 *          (the v2 meta-index model — this is what /dataset documents).
 * ?model=v1 : DEPRECATED legacy single global composite (composite_scores /
 *             sub_indexes). Kept only for old integrations.
 * ?live=true: admin-only direct fetch from external APIs (debugging).
 */

import { supabase } from '@/lib/supabase'
import { fetchAllRealData, computeScores } from '@/lib/realData'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const live = searchParams.get('live') === 'true'

  // Live mode: fetch from external APIs directly (admin only)
  if (live) {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      const { points, errors } = await fetchAllRealData()
      const scores = computeScores(points)
      return Response.json({
        scores,
        raw_points: points,
        errors,
        source: 'live',
        fetched_at: new Date().toISOString(),
      })
    } catch (error) {
      return Response.json({
        scores: null, raw_points: [], errors: [String(error)],
        source: 'live', fetched_at: new Date().toISOString(),
      }, { status: 500 })
    }
  }

  if (searchParams.get('model') !== 'v1') {
    return countriesResponse()
  }

  // Legacy v1: read from DB cache (written by /api/cron/refresh)
  try {
    const { data: rows, error } = await supabase
      .from('composite_scores')
      .select('*, sub_indexes(*)')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1)

    if (error || !rows || rows.length === 0) {
      return Response.json({
        scores: null, raw_points: [], errors: ['No cached scores in DB'],
        source: 'cache', fetched_at: new Date().toISOString(),
      }, { status: 404 })
    }

    const row = rows[0]
    const meta = row.metadata as Record<string, unknown> || {}

    // Reconstruct the scores format that the dashboard expects
    const domains: Record<string, { score: number | null; sources: string[]; dataPoints: unknown[]; hasData: boolean }> = {}
    for (const sub of row.sub_indexes || []) {
      const rd = sub.raw_data as Record<string, unknown> | null
      domains[sub.domain] = {
        score: sub.value,
        sources: (rd?.sources as string[]) || [],
        dataPoints: (rd?.dataPoints as unknown[]) || [],
        // sub.value NOT NULL — meşru 0 skorlu bir domain "no data" sayılmamalı.
        hasData: rd?.hasData !== false && sub.value !== null,
      }
    }

    // Collect raw_points from all sub_indexes
    const raw_points: unknown[] = []
    for (const sub of row.sub_indexes || []) {
      const rd = sub.raw_data as Record<string, unknown> | null
      if (rd?.dataPoints && Array.isArray(rd.dataPoints)) {
        raw_points.push(...rd.dataPoints)
      }
    }

    const activeDomains = Object.values(domains).filter(d => d.hasData).length

    return Response.json({
      scores: {
        composite: row.score_value,
        domains,
        band: row.band,
        activeDomains,
        totalDomains: Object.keys(domains).length,
        sources_connected: (meta.sources_connected as string[]) || [],
        sources_missing: (meta.sources_missing as string[]) || [],
      },
      raw_points,
      errors: (meta.errors as string[]) || [],
      source: 'cache',
      deprecated: 'model=v1 is the legacy single-composite model. Use /api/data (no params).',
      cached_at: row.computed_at,
      fetched_at: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({
      scores: null, raw_points: [], errors: [String(error)],
      source: 'cache', fetched_at: new Date().toISOString(),
    }, { status: 500 })
  }
}

const META_KEYS = ['economic', 'social', 'mental', 'technological', 'environmental'] as const

async function countriesResponse() {
  try {
    const [countriesRes, compositesRes, metaRes] = await Promise.all([
      supabase.from('countries').select('code, name, region').eq('active', true).order('name'),
      supabase
        .from('v_country_latest_composite')
        .select('country_code, score_value, band, delta, confidence, meta_indexes_with_data, computed_at'),
      supabase
        .from('v_country_latest_meta_indexes')
        .select('country_code, meta_index, value, weight, indicators_count, indicators_with_data'),
    ])
    if (countriesRes.error || compositesRes.error || metaRes.error) {
      const msg = countriesRes.error?.message ?? compositesRes.error?.message ?? metaRes.error?.message
      return Response.json({ ok: false, error: msg }, { status: 500 })
    }

    const compositeBy = new Map((compositesRes.data ?? []).map(r => [r.country_code as string, r]))
    const metaBy = new Map<string, Record<string, unknown>>()
    for (const m of metaRes.data ?? []) {
      const entry = metaBy.get(m.country_code as string) ?? {}
      entry[m.meta_index as string] = {
        value: m.value === null ? null : Number(m.value),
        weight: Number(m.weight),
        indicators_with_data: m.indicators_with_data,
        indicators_total: m.indicators_count,
      }
      metaBy.set(m.country_code as string, entry)
    }

    const countries = (countriesRes.data ?? []).map(c => {
      const comp = compositeBy.get(c.code)
      const meta = metaBy.get(c.code) ?? {}
      return {
        code: c.code,
        name: c.name,
        region: c.region,
        composite: comp ? Number(comp.score_value) : null,
        band: comp?.band ?? null,
        delta: comp?.delta ?? null,
        // Share of indicators with a usable observation — coverage, NOT a
        // statistical confidence interval.
        data_coverage: comp?.confidence ?? null,
        computed_at: comp?.computed_at ?? null,
        meta_indexes: Object.fromEntries(META_KEYS.map(k => [k, meta[k] ?? null])),
      }
    })

    return Response.json(
      {
        ok: true,
        model: 'meta-index-v2',
        license: 'CC BY-NC 4.0',
        attribution: 'The Human Index (thehumanindex.org)',
        methodology: 'https://thehumanindex.org/methodology',
        per_country_sources: 'https://thehumanindex.org/api/transparency/{iso2}',
        scale: '0-100, higher = more stress',
        generated_at: new Date().toISOString(),
        count: countries.length,
        countries,
      },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } },
    )
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
