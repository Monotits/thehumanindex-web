/**
 * /global — Multi-country composite dashboard (v2 architecture)
 *
 * Reads from the new meta-index framework (migration 007):
 *   - countries
 *   - indicators
 *   - v_country_latest_composite
 *   - v_country_latest_meta_indexes
 *   - v_country_latest_indicators
 *
 * Server component fetches all data, passes to client view for theming +
 * interactivity (country selector).
 */

import { createClient } from '@supabase/supabase-js'
import GlobalDashboardView from './GlobalDashboardView'

export const revalidate = 3600 // ISR: refresh hourly; cron-v2 also revalidates

export interface CountryRow {
  code: string
  name: string
  region: string | null
  flag_emoji: string | null
  active: boolean
}

export interface CompositeRow {
  id: string
  country_code: string
  score_value: number
  band: 'low' | 'moderate' | 'elevated' | 'high' | 'critical'
  delta: number | null
  confidence: number | null
  meta_indexes_with_data: number
  meta_indexes_total: number
  computed_at: string
}

export interface MetaIndexRow {
  id: string
  country_code: string
  country_composite_score_id: string
  meta_index: 'economic' | 'social' | 'mental' | 'technological' | 'environmental'
  value: number | null
  weight: number
  indicators_count: number
  indicators_with_data: number
}

export interface IndicatorRow {
  id: string
  meta_index: string
  name: string
  description: string | null
  source_org: string | null
  source_url: string | null
  unit: string | null
  display_order: number
  icon: string | null
}

export interface IndicatorValueRow {
  country_code: string
  indicator_id: string
  raw_value: number | null
  normalized_value: number | null
  reference_date: string
}

export interface DashboardData {
  countries: CountryRow[]
  composites: CompositeRow[]
  metaIndexes: MetaIndexRow[]
  indicators: IndicatorRow[]
  indicatorValues: IndicatorValueRow[]
}

async function loadDashboardData(): Promise<DashboardData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  const sb = createClient(url, anon)

  const [countriesRes, compositesRes, metaRes, indicatorsRes, valuesRes] = await Promise.all([
    sb.from('countries').select('*').eq('active', true).order('name'),
    sb.from('v_country_latest_composite').select('*'),
    sb.from('v_country_latest_meta_indexes').select('*'),
    sb.from('indicators').select('*').eq('active', true).order('display_order'),
    sb.from('v_country_latest_indicators').select('*'),
  ])

  return {
    countries: (countriesRes.data ?? []) as CountryRow[],
    composites: (compositesRes.data ?? []) as CompositeRow[],
    metaIndexes: (metaRes.data ?? []) as MetaIndexRow[],
    indicators: (indicatorsRes.data ?? []) as IndicatorRow[],
    indicatorValues: (valuesRes.data ?? []) as IndicatorValueRow[],
  }
}

export default async function GlobalDashboardPage() {
  const data = await loadDashboardData()
  if (!data || data.composites.length === 0) {
    return (
      <div style={{ padding: 48, fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto' }}>
        <h1>Global Dashboard</h1>
        <p>No composite data available yet. The meta-index pipeline (`/api/cron/refresh-v2`) needs to run at least once.</p>
      </div>
    )
  }
  return <GlobalDashboardView data={data} />
}
