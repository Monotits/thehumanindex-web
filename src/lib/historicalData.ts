/**
 * Historical Data Pipeline
 *
 * Computes monthly scores for past months using FRED/BLS date-range queries.
 * World Bank, OECD, WHO data is annual — we use the latest available value
 * for all months (these don't change month-to-month).
 *
 * Results are stored permanently in Supabase monthly_scores table.
 */

import { computeScores, DomainDataPoint } from './realData'

// ── Utility ──────────────────────────────────────────────

function normalize(value: number, low: number, high: number, invert = false): number {
  if (invert) {
    const [lo, hi] = low > high ? [low, high] : [high, low]
    const clamped = Math.max(hi, Math.min(lo, value))
    const score = ((lo - clamped) / (lo - hi)) * 100
    return Math.round(Math.max(0, Math.min(100, score)))
  }
  const clamped = Math.max(low, Math.min(high, value))
  const score = ((clamped - low) / (high - low)) * 100
  return Math.round(Math.max(0, Math.min(100, score)))
}

function makePoint(
  domain: string, indicator: string, value: number, normalized: number,
  source: string, series: string, period: string, context: string
): DomainDataPoint {
  return { domain, indicator, value, normalized, source, series, period, fetched_at: new Date().toISOString(), context }
}

/** Get the last day of a year-month string like '2025-11' */
function endOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${ym}-${String(lastDay).padStart(2, '0')}`
}

/** Get the first day of a year-month string */
function startOfMonth(ym: string): string {
  return `${ym}-01`
}

// ── FRED Historical Fetch ────────────────────────────────

interface FREDHistoricalSeries {
  id: string
  domain: string
  name: string
  low: number
  high: number
  invert: boolean
  context: string
}

const FRED_HISTORICAL: FREDHistoricalSeries[] = [
  { id: 'ICSA', domain: 'work_risk', name: 'Initial Jobless Claims',
    low: 180000, high: 800000, invert: false,
    context: '0 = 180K/week (boom), 100 = 800K+ (deep recession)' },
  { id: 'SIPOVGINIRUS', domain: 'inequality', name: 'Gini Index (US, Census)',
    low: 30, high: 55, invert: false,
    context: '0 = Gini 30 (very egalitarian), 100 = 55+ (extreme inequality)' },
  { id: 'T10Y2Y', domain: 'decay', name: '10Y-2Y Treasury Spread',
    low: 2.0, high: -1.5, invert: true,
    context: '0 = 2.0+ spread (healthy), 100 = -1.5 (deeply inverted)' },
  { id: 'PSAVERT', domain: 'wellbeing', name: 'Personal Saving Rate',
    low: 10, high: 1, invert: true,
    context: '0 = 10%+ savings, 100 = 1% (extreme fragility)' },
  { id: 'UMCSENT', domain: 'sentiment', name: 'Consumer Sentiment (U. Michigan)',
    low: 100, high: 45, invert: true,
    context: '0 = index 100+, 100 = 45 (crisis pessimism)' },
  { id: 'CSCICP03USM665S', domain: 'sentiment', name: 'Consumer Confidence (OECD)',
    low: 101, high: 96, invert: true,
    context: '0 = index 101+, 100 = 96 (deep pessimism)' },
  { id: 'GFDEGDQ188S', domain: 'policy', name: 'Federal Debt as % of GDP',
    low: 60, high: 150, invert: false,
    context: '0 = 60% debt/GDP, 100 = 150%+ (fiscal crisis)' },
  { id: 'G160291A027NBEA', domain: 'policy', name: 'Government Social Benefits',
    low: 800, high: 2000, invert: false,
    context: '0 = $800B/quarter, 100 = $2T+/quarter (crisis spending)' },
]

async function fetchFREDForMonth(yearMonth: string): Promise<DomainDataPoint[]> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return []

  const start = startOfMonth(yearMonth)
  const end = endOfMonth(yearMonth)
  const points: DomainDataPoint[] = []

  for (const s of FRED_HISTORICAL) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${apiKey}&file_type=json&observation_start=${start}&observation_end=${end}&sort_order=desc&limit=1`
      const res = await fetch(url)
      if (!res.ok) continue

      const json = await res.json()
      const obs = json.observations?.[0]
      if (!obs || obs.value === '.') continue

      const val = parseFloat(obs.value)
      points.push(makePoint(
        s.domain, s.name, val,
        normalize(val, s.low, s.high, s.invert),
        'FRED', s.id, obs.date, s.context,
      ))
    } catch {
      // skip silently for historical data
    }
  }

  return points
}

// ── BLS Historical Fetch ─────────────────────────────────

async function fetchBLSForMonth(yearMonth: string): Promise<DomainDataPoint[]> {
  const [yearStr, monthStr] = yearMonth.split('-')
  const points: DomainDataPoint[] = []

  try {
    const body: Record<string, unknown> = {
      seriesid: ['LNS14000000'],
      startyear: yearStr,
      endyear: yearStr,
    }
    if (process.env.BLS_API_KEY) body.registrationkey = process.env.BLS_API_KEY

    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return points
    const json = await res.json()
    if (json.status !== 'REQUEST_SUCCEEDED') return points

    const monthData = json.Results?.series?.[0]?.data?.find(
      (d: { period: string }) => d.period === `M${monthStr}`
    )
    if (monthData) {
      const val = parseFloat(monthData.value)
      points.push(makePoint(
        'work_risk', 'Unemployment Rate', val,
        normalize(val, 3.5, 15),
        'BLS', 'LNS14000000', `${yearStr}-${monthStr}`,
        '0 = 3.5% (full employment), 100 = 15%+ (depression)',
      ))
    }
  } catch {
    // skip
  }

  return points
}

// ── World Bank (Annual — same for all months in year) ────

async function fetchWorldBankAnnual(): Promise<DomainDataPoint[]> {
  const indicators = [
    { code: 'SI.POV.GINI', domain: 'inequality', name: 'Gini Index (World Bank)',
      low: 25, high: 55, invert: false, context: '0 = Gini 25, 100 = 55+' },
    { code: 'SI.DST.10TH.10', domain: 'inequality', name: 'Income Share Top 10%',
      low: 20, high: 50, invert: false, context: '0 = 20%, 100 = 50%+' },
    { code: 'GE.EST', domain: 'decay', name: 'Government Effectiveness',
      low: 2.5, high: -1.0, invert: true, context: '0 = 2.5, 100 = -1.0' },
    { code: 'VA.EST', domain: 'decay', name: 'Voice & Accountability',
      low: 2.0, high: -1.5, invert: true, context: '0 = 2.0, 100 = -1.5' },
    { code: 'RL.EST', domain: 'decay', name: 'Rule of Law',
      low: 2.5, high: -1.0, invert: true, context: '0 = 2.5, 100 = -1.0' },
    { code: 'CC.EST', domain: 'decay', name: 'Control of Corruption',
      low: 2.5, high: -1.0, invert: true, context: '0 = 2.5, 100 = -1.0' },
    { code: 'PV.EST', domain: 'unrest', name: 'Political Stability',
      low: 2.0, high: -2.0, invert: true, context: '0 = 2.0, 100 = -2.0' },
    { code: 'SH.STA.SUIC.P5', domain: 'wellbeing', name: 'Suicide Rate per 100K',
      low: 5, high: 25, invert: false, context: '0 = 5/100K, 100 = 25+/100K' },
    { code: 'SP.DYN.LE00.IN', domain: 'wellbeing', name: 'Life Expectancy',
      low: 82, high: 65, invert: true, context: '0 = 82+, 100 = 65' },
  ]

  const points: DomainDataPoint[] = []
  for (const ind of indicators) {
    try {
      const url = `https://api.worldbank.org/v2/country/USA/indicator/${ind.code}?format=json&per_page=5&date=2012:2025&mrv=1`
      const res = await fetch(url)
      if (!res.ok) continue

      const json = await res.json()
      const data = json?.[1]
      if (!data || data.length === 0) continue

      const latest = data.find((d: { value: number | null }) => d.value !== null)
      if (!latest) continue

      points.push(makePoint(
        ind.domain, ind.name, latest.value,
        normalize(latest.value, ind.low, ind.high, ind.invert),
        'World Bank', ind.code, latest.date, ind.context,
      ))
    } catch {
      // skip
    }
  }

  return points
}

// ── AI Index Static Data (same for all months) ───────────

function getAIIndexPoints(): DomainDataPoint[] {
  const REPORT_YEAR = '2025'
  return [
    makePoint('work_risk', 'Global AI Investment (AI Index)', 110,
      normalize(110, 20, 200), 'AI Index', 'corporate_investment', REPORT_YEAR,
      '0 = $20B/year, 100 = $200B+'),
    makePoint('work_risk', 'Enterprise AI Adoption Rate (AI Index)', 72,
      normalize(72, 20, 95), 'AI Index', 'enterprise_adoption', REPORT_YEAR,
      '0 = 20% adoption, 100 = 95%'),
  ]
}

// ── Main: Compute score for a specific month ─────────────

export interface MonthlyScore {
  year_month: string
  composite: number
  band: string
  work_risk: number | null
  inequality: number | null
  unrest: number | null
  decay: number | null
  wellbeing: number | null
  policy: number | null
  sentiment: number | null
  active_domains: number
  sources_connected: string[]
}

export async function computeMonthlyScore(yearMonth: string): Promise<MonthlyScore> {
  console.log(`[Historical] Computing score for ${yearMonth}...`)

  // Fetch all data for this month in parallel
  const [fredPoints, blsPoints, wbPoints] = await Promise.allSettled([
    fetchFREDForMonth(yearMonth),
    fetchBLSForMonth(yearMonth),
    fetchWorldBankAnnual(), // annual data, same for all months
  ])

  const allPoints: DomainDataPoint[] = []

  if (fredPoints.status === 'fulfilled') allPoints.push(...fredPoints.value)
  if (blsPoints.status === 'fulfilled') allPoints.push(...blsPoints.value)
  if (wbPoints.status === 'fulfilled') allPoints.push(...wbPoints.value)

  // Add AI Index static data
  allPoints.push(...getAIIndexPoints())

  const computed = computeScores(allPoints)

  return {
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
  }
}

/** Get past N months as year-month strings, e.g. ['2025-10', '2025-11', ...] */
export function getPastMonths(count: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}
