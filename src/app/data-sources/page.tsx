import { createClient } from '@supabase/supabase-js'
import DataSourcesView from './DataSourcesView'

export const revalidate = 3600 // ISR: refresh hourly; cron also revalidates this path

interface HealthRow {
  source: string
  status: 'ok' | 'degraded' | 'failed'
  last_success_at: string | null
  last_attempt_at: string
  last_error: string | null
  data_points_count: number
  domains_covered: string[] | null
  duration_ms: number | null
  recorded_at: string
}

interface UptimeRow {
  source: string
  uptime: number | null
  total_runs: number
  successful_runs: number
  most_recent_success: string | null
}

export interface DataSourceSummary {
  source: string
  status: 'ok' | 'degraded' | 'failed' | 'unknown'
  lastSuccessAt: string | null
  lastAttemptAt: string | null
  lastError: string | null
  dataPoints: number
  domains: string[]
  durationMs: number | null
  uptime30d: number | null   // 0..1 or null if never seen
  totalRuns30d: number
}

export interface DivergenceRow {
  metric: string
  domain: string
  observations: { source: string; indicator: string; rawValue: number; period: string }[]
  divergencePercent: number
  status: 'ok' | 'warning' | 'critical'
  thresholdPercent: number
}

async function loadSummaries(): Promise<{
  summaries: DataSourceSummary[]
  lastRunAt: string | null
  divergences: DivergenceRow[]
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return { summaries: [], lastRunAt: null, divergences: [] }

  const sb = createClient(url, anon)

  const [latestRes, uptimeRes, latestCompositeRes] = await Promise.all([
    sb.from('v_data_source_health_latest').select('*'),
    sb.from('v_data_source_uptime_30d').select('*'),
    sb.from('composite_scores')
      .select('metadata')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1),
  ])

  const latest: HealthRow[] = (latestRes.data as HealthRow[] | null) || []
  const uptime: UptimeRow[] = (uptimeRes.data as UptimeRow[] | null) || []

  const uptimeMap = new Map(uptime.map(u => [u.source, u]))

  const summaries: DataSourceSummary[] = latest.map(row => {
    const u = uptimeMap.get(row.source)
    return {
      source: row.source,
      status: row.status,
      lastSuccessAt: row.last_success_at,
      lastAttemptAt: row.last_attempt_at,
      lastError: row.last_error,
      dataPoints: row.data_points_count,
      domains: row.domains_covered ?? [],
      durationMs: row.duration_ms,
      uptime30d: u?.uptime ?? null,
      totalRuns30d: u?.total_runs ?? 0,
    }
  })

  // Sort: failed first, then degraded, then ok by name
  const order = { failed: 0, degraded: 1, ok: 2, unknown: 3 } as const
  summaries.sort((a, b) => order[a.status] - order[b.status] || a.source.localeCompare(b.source))

  const lastRunAt = latest
    .map(r => r.last_attempt_at)
    .sort()
    .at(-1) || null

  // Pull divergences from latest composite_scores.metadata (written by cron)
  const compositeMeta = (latestCompositeRes.data as { metadata: Record<string, unknown> | null }[] | null)?.[0]?.metadata
  const divergences: DivergenceRow[] = Array.isArray(compositeMeta?.divergences)
    ? compositeMeta!.divergences as DivergenceRow[]
    : []

  return { summaries, lastRunAt, divergences }
}

export default async function DataSourcesPage() {
  const { summaries, lastRunAt, divergences } = await loadSummaries()
  return <DataSourcesView summaries={summaries} lastRunAt={lastRunAt} divergences={divergences} />
}
