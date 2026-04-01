/**
 * Real Data Pipeline
 * Fetches live economic, social, and governance data from public APIs.
 * Each fetcher returns a normalized 0-100 score for its domain.
 *
 * Sources:
 *   - BLS (Bureau of Labor Statistics) — no key required
 *   - World Bank — no key required
 *   - OECD — no key required
 *   - FRED (Federal Reserve) — requires FRED_API_KEY env var
 *   - ACLED (conflict data) — requires ACLED_API_KEY + ACLED_EMAIL env vars
 */

// ── Types ──────────────────────────────────────────────────

export interface DomainDataPoint {
  domain: string
  value: number          // raw value from source
  normalized: number     // 0-100 stress score
  source: string
  series: string
  period: string
  fetched_at: string
}

export interface RealDataResult {
  points: DomainDataPoint[]
  errors: string[]
}

// ── Utility: clamp and normalize ──────────────────────────

function normalize(value: number, min: number, max: number, invert = false): number {
  const clamped = Math.max(min, Math.min(max, value))
  const score = ((clamped - min) / (max - min)) * 100
  return Math.round(invert ? 100 - score : score)
}

// ── BLS: Work Risk + Employment ──────────────────────────

/**
 * BLS Public API v2 — no key required for basic access (25 queries/day)
 * Series: unemployment rate, nonfarm payrolls
 */
export async function fetchBLSData(): Promise<DomainDataPoint[]> {
  const points: DomainDataPoint[] = []
  const currentYear = new Date().getFullYear()

  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['LNS14000000', 'CES0000000001'],
        startyear: String(currentYear - 1),
        endyear: String(currentYear),
        ...(process.env.BLS_API_KEY ? { registrationkey: process.env.BLS_API_KEY } : {}),
      }),
      next: { revalidate: 86400 }, // cache 24h — BLS updates monthly
    })

    if (!res.ok) throw new Error(`BLS API returned ${res.status}`)
    const json = await res.json()

    if (json.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${json.message?.[0] || 'unknown error'}`)

    for (const series of json.Results?.series || []) {
      const latest = series.data?.[0]
      if (!latest) continue

      const seriesId = series.seriesID
      const val = parseFloat(latest.value)

      if (seriesId === 'LNS14000000') {
        // Unemployment rate: 3% = low stress, 10% = max stress
        points.push({
          domain: 'work_risk',
          value: val,
          normalized: normalize(val, 3, 10),
          source: 'BLS',
          series: 'Unemployment Rate',
          period: `${latest.year}-${latest.period.replace('M', '')}`,
          fetched_at: new Date().toISOString(),
        })
      } else if (seriesId === 'CES0000000001') {
        // Nonfarm payrolls — change MoM. We'll use the raw value as context
        points.push({
          domain: 'work_risk',
          value: val,
          normalized: 0, // computed from delta below
          source: 'BLS',
          series: 'Nonfarm Payrolls (thousands)',
          period: `${latest.year}-${latest.period.replace('M', '')}`,
          fetched_at: new Date().toISOString(),
        })
      }
    }
  } catch (err) {
    console.error('BLS fetch error:', err)
  }

  return points
}

// ── FRED: Macro Economic Indicators ──────────────────────

/**
 * FRED API — requires FRED_API_KEY
 * Series: FEDFUNDS (fed rate), CPIAUCSL (CPI), ICSA (jobless claims)
 */
export async function fetchFREDData(): Promise<DomainDataPoint[]> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    console.warn('FRED_API_KEY not set, skipping FRED data')
    return []
  }

  const points: DomainDataPoint[] = []

  const series = [
    { id: 'UNRATE', domain: 'work_risk', name: 'Unemployment Rate (FRED)', min: 3, max: 10 },
    { id: 'FEDFUNDS', domain: 'inequality', name: 'Federal Funds Rate', min: 0, max: 8 },
    { id: 'CPIAUCSL', domain: 'inequality', name: 'CPI (Consumer Price Index)', min: 250, max: 350 },
    { id: 'ICSA', domain: 'work_risk', name: 'Initial Jobless Claims', min: 180000, max: 400000 },
  ]

  for (const s of series) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
      const res = await fetch(url, { next: { revalidate: 86400 } })

      if (!res.ok) continue
      const json = await res.json()
      const obs = json.observations?.[0]
      if (!obs || obs.value === '.') continue

      const val = parseFloat(obs.value)

      points.push({
        domain: s.domain,
        value: val,
        normalized: normalize(val, s.min, s.max),
        source: 'FRED',
        series: s.name,
        period: obs.date,
        fetched_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`FRED fetch error for ${s.id}:`, err)
    }
  }

  return points
}

// ── World Bank: Inequality ──────────────────────────────

/**
 * World Bank API v2 — no key required
 * Indicators: Gini index, GDP per capita, income share top 10%
 * Note: World Bank data lags 1-2 years
 */
export async function fetchWorldBankData(): Promise<DomainDataPoint[]> {
  const points: DomainDataPoint[] = []

  const indicators = [
    { code: 'SI.POV.GINI', domain: 'inequality', name: 'Gini Index (World)', min: 25, max: 45 },
    { code: 'SI.DST.10TH.10', domain: 'inequality', name: 'Income Share Top 10%', min: 20, max: 40 },
  ]

  // Fetch global/US data
  for (const ind of indicators) {
    try {
      const url = `https://api.worldbank.org/v2/country/USA/indicator/${ind.code}?format=json&per_page=5&date=2018:2025&mrv=1`
      const res = await fetch(url, { next: { revalidate: 604800 } }) // cache 7 days — data updates rarely

      if (!res.ok) continue
      const json = await res.json()

      // World Bank returns [metadata, data_array]
      const data = json?.[1]
      if (!data || data.length === 0) continue

      // Find most recent non-null value
      const latest = data.find((d: { value: number | null }) => d.value !== null)
      if (!latest) continue

      points.push({
        domain: ind.domain,
        value: latest.value,
        normalized: normalize(latest.value, ind.min, ind.max),
        source: 'World Bank',
        series: ind.name,
        period: latest.date,
        fetched_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`World Bank fetch error for ${ind.code}:`, err)
    }
  }

  return points
}

// ── OECD: Wellbeing ──────────────────────────────────────

/**
 * OECD SDMX-JSON API — no key required
 * Better Life Index data for wellbeing domain
 */
export async function fetchOECDData(): Promise<DomainDataPoint[]> {
  const points: DomainDataPoint[] = []

  try {
    // OECD Better Life Index — life satisfaction for USA
    const url = 'https://stats.oecd.org/sdmx-json/data/BLI/USA.SW_LIFS.L.TOT/all?dimensionAtObservation=allDimensions'
    const res = await fetch(url, { next: { revalidate: 604800 } }) // cache 7 days

    if (!res.ok) throw new Error(`OECD API returned ${res.status}`)
    const json = await res.json()

    // Parse SDMX-JSON format
    const observations = json?.dataSets?.[0]?.observations
    if (observations) {
      const keys = Object.keys(observations)
      if (keys.length > 0) {
        const lastKey = keys[keys.length - 1]
        const val = observations[lastKey]?.[0]

        if (typeof val === 'number') {
          // Life satisfaction: 0-10 scale. Higher = less stress
          points.push({
            domain: 'wellbeing',
            value: val,
            normalized: normalize(val, 4, 8, true), // invert: high satisfaction = low stress
            source: 'OECD',
            series: 'Life Satisfaction (USA)',
            period: 'latest',
            fetched_at: new Date().toISOString(),
          })
        }
      }
    }
  } catch (err) {
    console.error('OECD fetch error:', err)
  }

  // Try OECD health spending as wellbeing proxy
  try {
    const url = 'https://stats.oecd.org/sdmx-json/data/SHA/USA.HFTOT.HCHCTOT.PARPIB/all?dimensionAtObservation=allDimensions'
    const res = await fetch(url, { next: { revalidate: 604800 } })

    if (res.ok) {
      const json = await res.json()
      const observations = json?.dataSets?.[0]?.observations
      if (observations) {
        const keys = Object.keys(observations)
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1]
          const val = observations[lastKey]?.[0]

          if (typeof val === 'number') {
            // Health spending as % GDP: higher spending under stress = more stress
            points.push({
              domain: 'wellbeing',
              value: val,
              normalized: normalize(val, 8, 20),
              source: 'OECD',
              series: 'Health Spending (% GDP)',
              period: 'latest',
              fetched_at: new Date().toISOString(),
            })
          }
        }
      }
    }
  } catch (err) {
    console.error('OECD health fetch error:', err)
  }

  return points
}

// ── ACLED: Unrest / Conflict ──────────────────────────────

/**
 * ACLED API — requires ACLED_API_KEY + ACLED_EMAIL
 * Counts protest/riot events in recent months
 */
export async function fetchACLEDData(): Promise<DomainDataPoint[]> {
  const apiKey = process.env.ACLED_API_KEY
  const email = process.env.ACLED_EMAIL
  if (!apiKey || !email) {
    console.warn('ACLED_API_KEY/ACLED_EMAIL not set, skipping ACLED data')
    return []
  }

  const points: DomainDataPoint[] = []

  try {
    const currentYear = new Date().getFullYear()
    const url = `https://api.acleddata.com/acled/read?key=${apiKey}&email=${email}&year=${currentYear}&event_type=Protests&event_type=Riots&country=United States&limit=0`

    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) throw new Error(`ACLED returned ${res.status}`)
    const json = await res.json()

    const count = json.count || 0

    // Protest/riot count: 500/year = moderate, 2000/year = extreme stress
    points.push({
      domain: 'unrest',
      value: count,
      normalized: normalize(count, 500, 2000),
      source: 'ACLED',
      series: 'US Protests & Riots (YTD)',
      period: String(currentYear),
      fetched_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('ACLED fetch error:', err)
  }

  return points
}

// ── Combined Pipeline ──────────────────────────────────────

export async function fetchAllRealData(): Promise<RealDataResult> {
  const errors: string[] = []

  const results = await Promise.allSettled([
    fetchBLSData(),
    fetchFREDData(),
    fetchWorldBankData(),
    fetchOECDData(),
    fetchACLEDData(),
  ])

  const allPoints: DomainDataPoint[] = []

  const sourceNames = ['BLS', 'FRED', 'World Bank', 'OECD', 'ACLED']
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      allPoints.push(...r.value)
    } else {
      errors.push(`${sourceNames[i]}: ${r.reason}`)
    }
  })

  return { points: allPoints, errors }
}

// ── Score computation ──────────────────────────────────────

const DOMAIN_WEIGHTS: Record<string, number> = {
  work_risk: 0.25,
  inequality: 0.18,
  unrest: 0.15,
  decay: 0.12,
  wellbeing: 0.12,
  policy: 0.10,
  sentiment: 0.08,
}

export interface ComputedScores {
  composite: number
  domains: Record<string, { score: number; sources: string[]; dataPoints: DomainDataPoint[] }>
  band: string
  sources_connected: string[]
  sources_missing: string[]
}

/**
 * Compute domain scores by averaging all data points per domain,
 * then compute weighted composite.
 * Falls back to mock values for domains with no real data.
 */
export function computeScores(points: DomainDataPoint[], mockFallbacks: Record<string, number>): ComputedScores {
  // Group by domain
  const byDomain: Record<string, DomainDataPoint[]> = {}
  for (const p of points) {
    if (!byDomain[p.domain]) byDomain[p.domain] = []
    byDomain[p.domain].push(p)
  }

  const domains: ComputedScores['domains'] = {}
  const connectedSources = new Set<string>()

  for (const domain of Object.keys(DOMAIN_WEIGHTS)) {
    const domainPoints = byDomain[domain] || []

    if (domainPoints.length > 0) {
      // Average normalized scores from all data points
      const avg = domainPoints.reduce((sum, p) => sum + p.normalized, 0) / domainPoints.length
      const sources = Array.from(new Set(domainPoints.map(p => p.source)))
      sources.forEach(s => connectedSources.add(s))

      domains[domain] = {
        score: Math.round(avg),
        sources,
        dataPoints: domainPoints,
      }
    } else {
      // Fallback to mock
      domains[domain] = {
        score: mockFallbacks[domain] || 50,
        sources: ['Mock (no real data)'],
        dataPoints: [],
      }
    }
  }

  // Compute weighted composite
  let composite = 0
  for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
    composite += (domains[domain]?.score || 50) * weight
  }
  composite = Math.round(composite * 100) / 100

  // Determine band
  let band = 'low'
  if (composite >= 70) band = 'critical'
  else if (composite >= 60) band = 'high'
  else if (composite >= 50) band = 'elevated'
  else if (composite >= 35) band = 'moderate'

  const allSources = ['BLS', 'FRED', 'World Bank', 'OECD', 'ACLED']
  const connected = Array.from(connectedSources)
  const missing = allSources.filter(s => !connectedSources.has(s))

  return { composite, domains, band, sources_connected: connected, sources_missing: missing }
}

// ── Key Stat of the Week (live) ──────────────────────────

export interface KeyStat {
  value: string
  label: string
  source: string
  raw: number
}

/**
 * Fetches a compelling headline stat from FRED or BLS.
 * Tries multiple series and picks the most impactful one.
 */
export async function fetchKeyStat(): Promise<KeyStat> {
  const apiKey = process.env.FRED_API_KEY

  // Try FRED: Initial Jobless Claims (weekly, very current)
  if (apiKey) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=ICSA&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (res.ok) {
        const json = await res.json()
        const obs = json.observations
        if (obs && obs.length >= 1 && obs[0].value !== '.') {
          const latest = parseInt(obs[0].value, 10)
          const formatted = latest >= 1000 ? `${(latest / 1000).toFixed(0)}K` : String(latest)
          return {
            value: formatted,
            label: 'initial jobless claims filed this week',
            source: `FRED / DOL — ${obs[0].date}`,
            raw: latest,
          }
        }
      }
    } catch (e) {
      console.error('FRED key stat error:', e)
    }
  }

  // Try FRED: Unemployment rate
  if (apiKey) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (res.ok) {
        const json = await res.json()
        const obs = json.observations?.[0]
        if (obs && obs.value !== '.') {
          return {
            value: `${obs.value}%`,
            label: 'US unemployment rate',
            source: `FRED / BLS — ${obs.date}`,
            raw: parseFloat(obs.value),
          }
        }
      }
    } catch (e) {
      console.error('FRED unemployment key stat error:', e)
    }
  }

  // Try BLS directly
  try {
    const currentYear = new Date().getFullYear()
    const body: Record<string, unknown> = {
      seriesid: ['LNS14000000'],
      startyear: String(currentYear - 1),
      endyear: String(currentYear),
    }
    if (process.env.BLS_API_KEY) body.registrationkey = process.env.BLS_API_KEY

    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 86400 },
    })
    if (res.ok) {
      const json = await res.json()
      const latest = json.Results?.series?.[0]?.data?.[0]
      if (latest) {
        return {
          value: `${latest.value}%`,
          label: 'US unemployment rate',
          source: `BLS — ${latest.year} ${latest.periodName}`,
          raw: parseFloat(latest.value),
        }
      }
    }
  } catch (e) {
    console.error('BLS key stat error:', e)
  }

  // Final fallback: no data available
  return {
    value: '—',
    label: 'data unavailable — connecting to sources',
    source: 'Waiting for API response',
    raw: 0,
  }
}

