/**
 * GET /api/data — Return latest scores
 *
 * Default: reads from Supabase cache (fast, no external API calls)
 * With ?live=true: fetches from external APIs directly (slow, for debugging)
 */

import { supabase } from '@/lib/supabase'
import { fetchAllRealData, computeScores } from '@/lib/realData'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const live = searchParams.get('live') === 'true'

  // Live mode: fetch from external APIs directly (for debugging/testing)
  if (live) {
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

  // Default: read from DB cache (written by /api/cron/refresh)
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
        hasData: rd?.hasData !== false && sub.value > 0,
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
