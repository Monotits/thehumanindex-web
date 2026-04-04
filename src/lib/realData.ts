/**
 * Real Data Pipeline — v3
 *
 * Design principles:
 *   1. Each indicator maps to exactly ONE domain (no duplicates)
 *   2. 0 = best realistic scenario, 100 = genuine crisis / catastrophe
 *   3. Normalization ranges are anchored to real-world extremes
 *   4. Domains without data return null (NOT mock fallbacks)
 *   5. Composite score is reweighted across available domains only
 *
 * Score interpretation guide:
 *   0-25   LOW        Normal conditions, healthy indicators
 *   26-45  MODERATE   Growing tensions, some concerning signals
 *   46-65  ELEVATED   Significant stress, multiple warning signs
 *   66-80  HIGH       Serious deterioration, crisis-adjacent
 *   81-100 CRITICAL   Genuine crisis — mass unemployment, institutional collapse, etc.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ SOURCE          │ KEY     │ DOMAINS FED                        │
 * ├─────────────────┼─────────┼────────────────────────────────────│
 * │ BLS             │ env     │ work_risk                          │
 * │ FRED            │ env     │ work_risk, decay, sentiment,       │
 * │                 │         │ wellbeing, inequality               │
 * │ World Bank      │ none    │ inequality, decay                  │
 * │ OECD            │ none    │ wellbeing                          │
 * │ WHO GHO         │ none    │ wellbeing                          │
 * │ V-Dem (via WB)  │ none    │ decay, unrest                     │
 * │ Pew (via FRED)  │ env     │ sentiment                         │
 * │ CDC (via WB)    │ none    │ wellbeing                          │
 * │ ACLED           │ env     │ unrest (pending access)            │
 * │ O*NET           │ env     │ work_risk (3 indicators)           │
 * │ AI Index        │ static  │ work_risk (annual reference)       │
 * └─────────────────┴─────────┴────────────────────────────────────┘
 */

// ── Types ──────────────────────────────────────────────────

export interface DomainDataPoint {
  domain: string
  indicator: string       // human-readable indicator name
  value: number           // raw value from source
  normalized: number      // 0-100 stress score
  source: string          // API source name
  series: string          // series ID or endpoint
  period: string          // date or period of observation
  fetched_at: string
  context: string         // what does 0 and 100 mean for this indicator
}

export interface RealDataResult {
  points: DomainDataPoint[]
  errors: string[]
}

export interface ComputedScores {
  composite: number
  domains: Record<string, {
    score: number | null
    sources: string[]
    dataPoints: DomainDataPoint[]
    hasData: boolean
  }>
  band: string
  activeDomains: number
  totalDomains: number
  sources_connected: string[]
  sources_missing: string[]
}

export interface KeyStat {
  value: string
  label: string
  source: string
  raw: number
}

// ── Utility: clamp and normalize ──────────────────────────

function normalize(value: number, low: number, high: number, invert = false): number {
  if (invert) {
    // For inverted indicators: higher raw value = LESS stress (score closer to 0)
    // low param = value where stress is highest (score 100)
    // high param = value where stress is lowest (score 0)
    // Example: Consumer Sentiment — low=50 (crisis, score 100), high=101 (optimistic, score 0)
    const minBound = Math.min(low, high)
    const maxBound = Math.max(low, high)
    const clamped = Math.max(minBound, Math.min(maxBound, value))
    const score = ((maxBound - clamped) / (maxBound - minBound)) * 100
    return Math.round(Math.max(0, Math.min(100, score)))
  }
  // Normal: higher raw value = MORE stress (score closer to 100)
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

// ═══════════════════════════════════════════════════════════
// 1. BLS — Bureau of Labor Statistics
//    Unemployment Rate → work_risk
// ═══════════════════════════════════════════════════════════

export async function fetchBLSData(): Promise<DomainDataPoint[]> {
  const points: DomainDataPoint[] = []
  const currentYear = new Date().getFullYear()

  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['LNS14000000'],
        startyear: String(currentYear - 1),
        endyear: String(currentYear),
        ...(process.env.BLS_API_KEY ? { registrationkey: process.env.BLS_API_KEY } : {}),
      }),
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`BLS API returned ${res.status}`)
    const json = await res.json()
    if (json.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${json.message?.[0] || 'unknown'}`)

    const latest = json.Results?.series?.[0]?.data?.[0]
    if (latest) {
      const val = parseFloat(latest.value)
      points.push(makePoint(
        'work_risk', 'Unemployment Rate', val,
        normalize(val, 3.5, 15),
        'BLS', 'LNS14000000',
        `${latest.year}-${latest.period.replace('M', '')}`,
        '0 = 3.5% (full employment), 100 = 15%+ (depression)',
      ))
    }
  } catch (err) {
    console.error('BLS fetch error:', err)
  }
  return points
}

// ═══════════════════════════════════════════════════════════
// 2. FRED — Federal Reserve Economic Data
//    Includes Pew-proxy sentiment data
// ═══════════════════════════════════════════════════════════

const FRED_SERIES = [
  // work_risk
  { id: 'ICSA', domain: 'work_risk', name: 'Initial Jobless Claims',
    low: 180000, high: 800000, invert: false,
    context: '0 = 180K/week (boom), 100 = 800K+ (deep recession)' },

  // inequality — FRED Gini for United States
  // NOTE: FRED reports Gini as whole numbers (e.g. 41.5), not decimals (0.415)
  // CRITICAL FIX: Was SIPOVGINIRUS (Russia!) — corrected to SIPOVGINIUSA (United States)
  { id: 'SIPOVGINIUSA', domain: 'inequality', name: 'Gini Index (US, Census)',
    low: 30, high: 55, invert: false,
    context: '0 = Gini 30 (very egalitarian), 100 = 55+ (extreme inequality)' },

  // decay — yield curve as recession probability proxy
  { id: 'T10Y2Y', domain: 'decay', name: '10Y-2Y Treasury Spread',
    low: 2.0, high: -1.5, invert: true,
    context: '0 = 2.0+ spread (healthy), 100 = -1.5 (deeply inverted, recession)' },

  // wellbeing — financial fragility
  { id: 'PSAVERT', domain: 'wellbeing', name: 'Personal Saving Rate',
    low: 10, high: 1, invert: true,
    context: '0 = 10%+ savings (healthy), 100 = 1% (extreme financial fragility)' },

  // sentiment — UMich Consumer Sentiment (Pew proxy)
  { id: 'UMCSENT', domain: 'sentiment', name: 'Consumer Sentiment (U. Michigan)',
    low: 100, high: 45, invert: true,
    context: '0 = index 100+ (optimistic), 100 = 45 (crisis-level pessimism)' },

  // sentiment — Consumer Confidence (Conference Board via FRED)
  { id: 'CSCICP03USM665S', domain: 'sentiment', name: 'Consumer Confidence (OECD)',
    low: 101, high: 96, invert: true,
    context: '0 = index 101+ (confident), 100 = 96 (deep pessimism)' },

  // policy — Federal debt as % of GDP (fiscal sustainability)
  // GFDEGDQ188S = "Federal Debt: Total Public Debt as Percent of GDP" (quarterly, ~120%)
  { id: 'GFDEGDQ188S', domain: 'policy', name: 'Federal Debt as % of GDP',
    low: 60, high: 150, invert: false,
    context: '0 = 60% debt/GDP (sustainable), 100 = 150%+ (fiscal crisis)' },

  // policy — Social spending (in billions of dollars)
  // G160291A027NBEA reports in billions; US social benefits ~$1.2-1.5T quarterly
  { id: 'G160291A027NBEA', domain: 'policy', name: 'Government Social Benefits',
    low: 800, high: 2000, invert: false,
    context: '0 = $800B/quarter (normal), 100 = $2T+/quarter (crisis-level spending)' },
]

export async function fetchFREDData(): Promise<DomainDataPoint[]> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    console.warn('FRED_API_KEY not set, skipping FRED data')
    return []
  }

  const points: DomainDataPoint[] = []

  for (const s of FRED_SERIES) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
      const res = await fetch(url, { cache: 'no-store' })

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
    } catch (err) {
      console.error(`FRED fetch error for ${s.id}:`, err)
    }
  }

  return points
}

// ═══════════════════════════════════════════════════════════
// 3. World Bank — Inequality + Governance (V-Dem proxy)
//    Also includes CDC proxy via SH.STA.SUIC.P5
// ═══════════════════════════════════════════════════════════

const WORLDBANK_INDICATORS = [
  // inequality
  { code: 'SI.POV.GINI', domain: 'inequality', name: 'Gini Index (World Bank)',
    low: 25, high: 55, invert: false,
    context: '0 = Gini 25 (Nordic), 100 = 55+ (extreme inequality)' },
  { code: 'SI.DST.10TH.10', domain: 'inequality', name: 'Income Share Top 10%',
    low: 20, high: 50, invert: false,
    context: '0 = top 10% holds 20%, 100 = holds 50%+ (oligarchic)' },

  // decay — V-Dem proxy via World Governance Indicators (WGI)
  { code: 'GE.EST', domain: 'decay', name: 'Government Effectiveness (V-Dem/WGI)',
    low: 2.5, high: -1.0, invert: true,
    context: '0 = score 2.5 (excellent governance), 100 = -1.0 (failed state)' },
  { code: 'VA.EST', domain: 'decay', name: 'Voice & Accountability (V-Dem/WGI)',
    low: 2.0, high: -1.5, invert: true,
    context: '0 = score 2.0 (free democracy), 100 = -1.5 (authoritarian)' },
  { code: 'RL.EST', domain: 'decay', name: 'Rule of Law (V-Dem/WGI)',
    low: 2.5, high: -1.0, invert: true,
    context: '0 = score 2.5 (strong rule of law), 100 = -1.0 (lawlessness)' },
  { code: 'CC.EST', domain: 'decay', name: 'Control of Corruption (V-Dem/WGI)',
    low: 2.5, high: -1.0, invert: true,
    context: '0 = score 2.5 (clean government), 100 = -1.0 (endemic corruption)' },

  // unrest — V-Dem proxy: Political Stability
  { code: 'PV.EST', domain: 'unrest', name: 'Political Stability (V-Dem/WGI)',
    low: 2.0, high: -2.0, invert: true,
    context: '0 = score 2.0 (very stable), 100 = -2.0 (severe unrest/violence)' },

  // wellbeing — CDC proxy: suicide rate
  { code: 'SH.STA.SUIC.P5', domain: 'wellbeing', name: 'Suicide Rate per 100K (CDC proxy)',
    low: 5, high: 25, invert: false,
    context: '0 = 5/100K (low), 100 = 25+/100K (mental health crisis)' },

  // wellbeing — life expectancy
  { code: 'SP.DYN.LE00.IN', domain: 'wellbeing', name: 'Life Expectancy at Birth',
    low: 82, high: 65, invert: true,
    context: '0 = 82+ years (healthy nation), 100 = 65 years (severe health crisis)' },
]

export async function fetchWorldBankData(): Promise<DomainDataPoint[]> {
  // Fetch all indicators in PARALLEL (not sequential) to stay within timeout
  const results = await Promise.allSettled(
    WORLDBANK_INDICATORS.map(async (ind) => {
      const url = `https://api.worldbank.org/v2/country/USA/indicator/${ind.code}?format=json&per_page=5&date=2012:2025&mrv=1`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return null

      const json = await res.json()
      const data = json?.[1]
      if (!data || data.length === 0) return null

      const latest = data.find((d: { value: number | null }) => d.value !== null)
      if (!latest) return null

      return makePoint(
        ind.domain, ind.name, latest.value,
        normalize(latest.value, ind.low, ind.high, ind.invert),
        'World Bank', ind.code, latest.date, ind.context,
      )
    })
  )

  const points: DomainDataPoint[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      points.push(r.value)
    } else if (r.status === 'rejected') {
      console.error(`World Bank fetch error for ${WORLDBANK_INDICATORS[i].code}:`, r.reason)
    }
  })

  return points
}

// ═══════════════════════════════════════════════════════════
// 4. OECD — Wellbeing (Better Life Index)
// ═══════════════════════════════════════════════════════════

export async function fetchOECDData(): Promise<DomainDataPoint[]> {
  const points: DomainDataPoint[] = []

  // OECD moved from stats.oecd.org to sdmx.oecd.org in 2024
  // Try new API first, fall back to old API
  const OECD_INDICATORS = [
    {
      newUrl: 'https://sdmx.oecd.org/public/rest/data/OECD.WISE.WDP,DSD_BLI@DF_BLI,/A.USA.SW_LIFS..?format=jsondata',
      oldUrl: 'https://stats.oecd.org/sdmx-json/data/BLI/USA.SW_LIFS.L.TOT/all?dimensionAtObservation=allDimensions',
      domain: 'wellbeing', name: 'Life Satisfaction (OECD)', series: 'BLI/SW_LIFS',
      low: 8.0, high: 3.0, invert: true,
      context: '0 = 8.0/10 (very happy), 100 = 3.0/10 (deep despair)',
      isFraction: false,
    },
    {
      newUrl: 'https://sdmx.oecd.org/public/rest/data/OECD.WISE.WDP,DSD_BLI@DF_BLI,/A.USA.CG_TRSTGOV..?format=jsondata',
      oldUrl: 'https://stats.oecd.org/sdmx-json/data/BLI/USA.CG_TRSTGOV.L.TOT/all?dimensionAtObservation=allDimensions',
      domain: 'decay', name: 'Trust in Government (OECD)', series: 'BLI/CG_TRSTGOV',
      low: 70, high: 10, invert: true,
      context: '0 = 70%+ trust (healthy democracy), 100 = 10% trust (institutional collapse)',
      isFraction: true,
    },
    {
      newUrl: 'https://sdmx.oecd.org/public/rest/data/OECD.WISE.WDP,DSD_BLI@DF_BLI,/A.USA.CG_VOTO..?format=jsondata',
      oldUrl: 'https://stats.oecd.org/sdmx-json/data/BLI/USA.CG_VOTO.L.TOT/all?dimensionAtObservation=allDimensions',
      domain: 'unrest', name: 'Voter Turnout (OECD)', series: 'BLI/CG_VOTO',
      low: 80, high: 30, invert: true,
      context: '0 = 80%+ turnout (engaged citizenry), 100 = 30% (civic collapse)',
      isFraction: true,
    },
  ]

  // Helper to extract value from OECD SDMX JSON (works for both old and new API formats)
  function extractOECDValue(json: Record<string, unknown>): number | null {
    // New API format (jsondata)
    const dataSets = json?.dataSets as Array<Record<string, unknown>> | undefined
    if (dataSets?.[0]) {
      const series = (dataSets[0].series || dataSets[0].observations) as Record<string, Record<string, unknown>> | undefined
      if (series) {
        for (const key of Object.keys(series)) {
          const obs = series[key]?.observations as Record<string, number[]> | undefined
          if (obs) {
            const obsKeys = Object.keys(obs).sort()
            const lastKey = obsKeys[obsKeys.length - 1]
            if (lastKey && obs[lastKey]?.[0] != null) return obs[lastKey][0]
          }
        }
      }
      // Old API format: dataSets[0].observations directly
      const observations = dataSets[0].observations as Record<string, number[]> | undefined
      if (observations) {
        const keys = Object.keys(observations)
        if (keys.length > 0) {
          const val = observations[keys[keys.length - 1]]?.[0]
          if (typeof val === 'number') return val
        }
      }
    }
    return null
  }

  // Fetch all indicators in parallel
  const results = await Promise.allSettled(
    OECD_INDICATORS.map(async (ind) => {
      // Try new API first, then old
      const errors: string[] = []
      for (const url of [ind.newUrl, ind.oldUrl]) {
        try {
          const res = await fetch(url, { cache: 'no-store' as RequestCache })
          if (!res.ok) {
            errors.push(`${url.substring(0, 60)}... → HTTP ${res.status}`)
            continue
          }
          const json = await res.json()
          const val = extractOECDValue(json)
          if (val != null) {
            const finalVal = ind.isFraction && val <= 1 ? val * 100 : val
            return makePoint(
              ind.domain, ind.name, finalVal,
              normalize(finalVal, ind.low, ind.high, ind.invert),
              'OECD', ind.series, 'latest', ind.context,
            )
          }
          errors.push(`${url.substring(0, 60)}... → no value in response`)
        } catch (err) {
          errors.push(`${url.substring(0, 60)}... → ${String(err).substring(0, 100)}`)
          continue
        }
      }
      console.warn(`OECD ${ind.series}: all URLs failed:`, errors)
      return null
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) points.push(r.value)
  }

  return points
}

// ═══════════════════════════════════════════════════════════
// 5. WHO GHO — Global Health Observatory
//    Suicide rate, mental health → wellbeing
// ═══════════════════════════════════════════════════════════

export async function fetchWHOData(): Promise<DomainDataPoint[]> {
  const WHO_INDICATORS = [
    {
      url: 'https://ghoapi.azureedge.net/api/SDGSUICIDE?$filter=SpatialDim%20eq%20%27USA%27%20and%20Dim1%20eq%20%27BTSX%27&$orderby=TimeDim%20desc&$top=1',
      domain: 'wellbeing', name: 'Suicide Rate per 100K (WHO)', series: 'SDGSUICIDE',
      low: 5, high: 30, invert: false,
      context: '0 = 5/100K (low suicide rate), 100 = 30+/100K (mental health catastrophe)',
    },
    {
      url: 'https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim%20eq%20%27USA%27%20and%20Dim1%20eq%20%27BTSX%27&$orderby=TimeDim%20desc&$top=1',
      domain: 'wellbeing', name: 'Life Expectancy at Birth (WHO)', series: 'WHOSIS_000001',
      low: 82, high: 60, invert: true,
      context: '0 = 82+ years (Japan-level health), 100 = 60 years (health system collapse)',
    },
    {
      url: 'https://ghoapi.azureedge.net/api/SA_0000001688?$filter=SpatialDim%20eq%20%27USA%27%20and%20Dim1%20eq%20%27BTSX%27&$orderby=TimeDim%20desc&$top=1',
      domain: 'wellbeing', name: 'Alcohol Consumption per Capita (WHO)', series: 'SA_0000001688',
      low: 5, high: 15, invert: false,
      context: '0 = 5L/year (moderate), 100 = 15L+ (severe substance abuse crisis)',
    },
  ]

  // Fetch all WHO indicators in parallel
  const results = await Promise.allSettled(
    WHO_INDICATORS.map(async (ind) => {
      const res = await fetch(ind.url, { cache: 'no-store' as RequestCache })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`WHO ${ind.series}: HTTP ${res.status} — ${body.substring(0, 200)}`)
        return null
      }
      const json = await res.json()
      const item = json?.value?.[0]
      if (!item || item.NumericValue == null) {
        console.warn(`WHO ${ind.series}: no data. Keys: ${JSON.stringify(Object.keys(json || {}))}, value count: ${json?.value?.length || 0}`)
        return null
      }

      const val = item.NumericValue
      return makePoint(
        ind.domain, ind.name, val,
        normalize(val, ind.low, ind.high, ind.invert),
        'WHO', ind.series, String(item.TimeDim || 'latest'), ind.context,
      )
    })
  )

  const points: DomainDataPoint[] = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) points.push(r.value)
    else if (r.status === 'rejected') console.error('WHO fetch error:', r.reason)
  }
  return points
}

// ═══════════════════════════════════════════════════════════
// 6. ACLED — Conflict/Unrest (pending access)
// ═══════════════════════════════════════════════════════════

export async function fetchACLEDData(): Promise<DomainDataPoint[]> {
  const email = process.env.ACLED_EMAIL
  const password = process.env.ACLED_PASSWORD
  if (!email || !password) return []

  const points: DomainDataPoint[] = []

  try {
    // Step 1: Get OAuth access token
    const tokenRes = await fetch('https://acleddata.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: email,
        password: password,
        grant_type: 'password',
        client_id: 'acled',
      }),
      cache: 'no-store' as RequestCache,
    })
    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => '')
      throw new Error(`ACLED OAuth failed: ${tokenRes.status} — ${body.substring(0, 200)}`)
    }
    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token
    if (!accessToken) throw new Error('ACLED OAuth: no access_token in response')

    // Step 2: Fetch protest/riot data for US using the new API
    // New API format: /api/acled/read?_format=json&filters...
    // Use event_type with pipe separator and event_date for current year
    const currentYear = new Date().getFullYear()
    const params = new URLSearchParams({
      _format: 'json',
      event_type: 'Protests|Riots',
      country: 'United States',
      year: String(currentYear),
      limit: '5000',
    })
    const apiUrl = `https://acleddata.com/api/acled/read?${params.toString()}`
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store' as RequestCache,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`ACLED API returned ${res.status} — ${body.substring(0, 200)}`)
    }
    const json = await res.json()

    // New API returns array of events directly, or { data: [...] }
    const events = Array.isArray(json) ? json : (json.data || [])
    const count = events.length || 0
    points.push(makePoint(
      'unrest', 'US Protests & Riots YTD (ACLED)', count,
      normalize(count, 500, 3000),
      'ACLED', 'protests_riots_usa', String(currentYear),
      '0 = ~500/year (normal), 100 = 3000+ (mass civil unrest)',
    ))
  } catch (err) {
    console.error('ACLED fetch error:', err)
  }

  return points
}

// ═══════════════════════════════════════════════════════════
// 7. O*NET — Occupational Automation & Workforce Signals
// ═══════════════════════════════════════════════════════════

export async function fetchONETData(): Promise<DomainDataPoint[]> {
  const apiKey = process.env.ONET_API_KEY
  if (!apiKey) return []

  const points: DomainDataPoint[] = []

  // O*NET API v2.0: new base URL + X-API-Key header
  async function onetFetch(path: string) {
    const res = await fetch(`https://api-v2.onetcenter.org/${path}`, {
      headers: { 'X-API-Key': apiKey!, Accept: 'application/json' },
      cache: 'no-store' as RequestCache,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`O*NET ${path}: HTTP ${res.status} — ${body.substring(0, 200)}`)
    }
    return res.json()
  }

  // Run all O*NET queries in parallel
  const results = await Promise.allSettled([
    // 1. Hot Technologies — emerging tech skills disrupting the labor market
    onetFetch('online/hot_technology?start=1&end=20'),
    // 2. Bright Outlook occupations — growing jobs (inverse risk signal)
    onetFetch('online/bright_outlook?start=1&end=20'),
    // 3. Search for AI/automation-related occupations gaining prominence
    onetFetch('online/search?keyword=artificial+intelligence&start=1&end=10'),
  ])

  // ── Indicator 1: Hot Technology Count ──
  // More hot technologies = faster skill obsolescence = higher work risk
  if (results[0].status === 'fulfilled') {
    try {
      const json = results[0].value
      const totalHotTechs = json.total || 0
      // Range: 100 (stable tech landscape) → 600 (massive disruption)
      // O*NET typically lists 200-400+ hot technologies; wider range avoids ceiling
      points.push(makePoint(
        'work_risk', 'Hot Technology Count (O*NET)', totalHotTechs,
        normalize(totalHotTechs, 100, 600),
        'O*NET', 'hot_technology', 'latest',
        '0 = ≤100 hot techs (stable), 100 = 600+ (massive skill disruption)',
      ))
    } catch (e) { console.error('O*NET hot_tech parse:', e) }
  }

  // ── Indicator 2: Bright Outlook Ratio ──
  // More bright outlook occupations = healthier job market = lower risk
  if (results[1].status === 'fulfilled') {
    try {
      const json = results[1].value
      const totalBright = json.total || 0
      // Range: inverted — more bright outlook = LESS risk
      // 500+ bright outlook occupations = healthy, <150 = severe contraction
      // NOTE: for invert=true, first param (low) must be > second param (high)
      points.push(makePoint(
        'work_risk', 'Bright Outlook Occupations (O*NET)', totalBright,
        normalize(totalBright, 500, 150, true),
        'O*NET', 'bright_outlook', 'latest',
        '0 = 500+ bright occupations (strong growth), 100 = <150 (severe contraction)',
      ))
    } catch (e) { console.error('O*NET bright parse:', e) }
  }

  // ── Indicator 3: AI Occupation Penetration ──
  // How many occupations are now AI-related — higher = more displacement pressure
  if (results[2].status === 'fulfilled') {
    try {
      const json = results[2].value
      const aiOccupations = json.total || 0
      // Range: 10 (AI is niche) → 300 (AI pervades most occupations)
      // O*NET keyword search can return many results; wider range for accuracy
      points.push(makePoint(
        'work_risk', 'AI-Related Occupations (O*NET)', aiOccupations,
        normalize(aiOccupations, 10, 300),
        'O*NET', 'ai_occupations', 'latest',
        '0 = ≤10 AI occupations (niche), 100 = 300+ (AI pervades workforce)',
      ))
    } catch (e) { console.error('O*NET AI search parse:', e) }
  }

  if (results.every(r => r.status === 'rejected')) {
    const errors = results.map(r => r.status === 'rejected' ? String(r.reason) : '').filter(Boolean)
    console.error('O*NET: all requests failed:', errors)
    throw new Error(`O*NET: all failed — ${errors[0]}`)
  }

  return points
}

// ═══════════════════════════════════════════════════════════
// 8. Stanford AI Index — Annual Reference Data (static)
//    Updated yearly from https://hai.stanford.edu/ai-index
// ═══════════════════════════════════════════════════════════

function getAIIndexData(): DomainDataPoint[] {
  // Data from Stanford HAI AI Index Report 2025
  // These are updated annually when new report is published
  // ⚠ STALENESS CHECK: Warn if data is older than 14 months
  const REPORT_YEAR = '2025'
  const reportDate = new Date(2025, 3, 1) // April 2025 publication
  const monthsSinceReport = Math.floor((Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  if (monthsSinceReport > 14) {
    console.warn(`[THI] ⚠ AI Index data is ${monthsSinceReport} months old. Update from https://hai.stanford.edu/ai-index`)
  }
  const points: DomainDataPoint[] = []

  // Global corporate AI investment ($ billions)
  // 2023: $67.2B → 2024: $110B+ (estimated). Rapid growth = more displacement pressure
  const aiInvestment = 110 // billions
  points.push(makePoint(
    'work_risk', 'Global AI Investment (AI Index)', aiInvestment,
    normalize(aiInvestment, 20, 200),
    'AI Index', 'corporate_investment', REPORT_YEAR,
    '0 = $20B/year (early stage), 100 = $200B+ (massive automation wave)',
  ))

  // AI adoption rate in enterprises (%)
  // 2023: 55% of companies using AI → 2024: 72%
  const adoptionRate = 72
  points.push(makePoint(
    'work_risk', 'Enterprise AI Adoption Rate (AI Index)', adoptionRate,
    normalize(adoptionRate, 20, 95),
    'AI Index', 'enterprise_adoption', REPORT_YEAR,
    '0 = 20% adoption (niche), 100 = 95% (near-total automation deployment)',
  ))

  return points
}

// ═══════════════════════════════════════════════════════════
// 9. OECD Reference Data (static until new API stabilizes)
//    Source: OECD Better Life Index 2024
//    The old stats.oecd.org API is shut down (500) and the new
//    sdmx.oecd.org hasn't migrated BLI yet (404).
//    TODO: Reconnect live API when OECD completes migration.
// ═══════════════════════════════════════════════════════════

function getOECDReferenceData(): DomainDataPoint[] {
  // ⚠ STALENESS CHECK: Warn if OECD reference data is older than 18 months
  const REPORT_YEAR = '2024'
  const reportDate = new Date(2024, 5, 1) // Mid-2024 data vintage
  const monthsSinceReport = Math.floor((Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  if (monthsSinceReport > 18) {
    console.warn(`[THI] ⚠ OECD reference data is ${monthsSinceReport} months old. Check if new API is available at sdmx.oecd.org`)
  }
  const points: DomainDataPoint[] = []

  // Life satisfaction (0-10 scale). US: 6.9/10 (OECD BLI 2024)
  const lifeSatisfaction = 6.9
  points.push(makePoint(
    'wellbeing', 'Life Satisfaction (OECD BLI)', lifeSatisfaction,
    normalize(lifeSatisfaction, 8.0, 3.0, true),
    'OECD', 'BLI/SW_LIFS', REPORT_YEAR,
    '0 = 8.0/10 (very happy), 100 = 3.0/10 (deep despair)',
  ))

  // Trust in government (% of population). US: ~30% (OECD/Pew 2024)
  const trustGov = 30
  points.push(makePoint(
    'decay', 'Trust in Government (OECD/Pew)', trustGov,
    normalize(trustGov, 70, 10, true),
    'OECD', 'BLI/CG_TRSTGOV', REPORT_YEAR,
    '0 = 70%+ trust (healthy democracy), 100 = 10% trust (institutional collapse)',
  ))

  // Voter turnout (%). US: ~66% (2024 presidential election)
  const voterTurnout = 66
  points.push(makePoint(
    'unrest', 'Voter Turnout (OECD ref)', voterTurnout,
    normalize(voterTurnout, 80, 30, true),
    'OECD', 'BLI/CG_VOTO', REPORT_YEAR,
    '0 = 80%+ turnout (engaged citizenry), 100 = 30% (civic collapse)',
  ))

  return points
}

// ═══════════════════════════════════════════════════════════
// Combined Pipeline
// ═══════════════════════════════════════════════════════════

// Wrap a promise with a timeout to prevent build-time hangs
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function fetchAllRealData(): Promise<RealDataResult> {
  const errors: string[] = []
  const TIMEOUT = 25000 // 25s per source (cron has 60s total, sources run in parallel)

  const results = await Promise.allSettled([
    withTimeout(fetchBLSData(), TIMEOUT, 'BLS'),
    withTimeout(fetchFREDData(), TIMEOUT, 'FRED'),
    withTimeout(fetchWorldBankData(), TIMEOUT, 'World Bank'),
    // OECD live API is in transition (old API shut down, new API hasn't migrated BLI)
    // Using static reference data instead — see getOECDReferenceData()
    // withTimeout(fetchOECDData(), TIMEOUT, 'OECD'),
    // WHO API deprecated end of 2025; USA data returns empty
    // World Bank already covers suicide rate + life expectancy
    // withTimeout(fetchWHOData(), TIMEOUT, 'WHO'),
    withTimeout(fetchACLEDData(), TIMEOUT, 'ACLED'),
    withTimeout(fetchONETData(), TIMEOUT, 'O*NET'),
  ])

  const allPoints: DomainDataPoint[] = []
  const sourceNames = ['BLS', 'FRED', 'World Bank', 'ACLED', 'O*NET']

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      allPoints.push(...r.value)
      console.log(`[Data Pipeline] ${sourceNames[i]}: ${r.value.length} data points`)
    } else {
      errors.push(`${sourceNames[i]}: ${r.reason}`)
      console.warn(`[Data Pipeline] ${sourceNames[i]}: FAILED —`, r.reason)
    }
  })

  // Add static reference data (always available)
  allPoints.push(...getAIIndexData())
  allPoints.push(...getOECDReferenceData())

  console.log(`[Data Pipeline] Total: ${allPoints.length} data points, ${errors.length} errors`)
  // Log each point's raw → normalized for debugging
  for (const p of allPoints) {
    console.log(`  [${p.domain}] ${p.indicator}: raw=${p.value} → normalized=${p.normalized}`)
  }

  return { points: allPoints, errors }
}

// ═══════════════════════════════════════════════════════════
// Score Computation
// ═══════════════════════════════════════════════════════════

const DOMAIN_WEIGHTS: Record<string, number> = {
  work_risk: 0.25,
  inequality: 0.18,
  unrest: 0.15,
  decay: 0.12,
  wellbeing: 0.12,
  policy: 0.10,
  sentiment: 0.08,
}

export function computeScores(points: DomainDataPoint[]): ComputedScores {
  const byDomain: Record<string, DomainDataPoint[]> = {}
  for (const p of points) {
    if (!byDomain[p.domain]) byDomain[p.domain] = []
    byDomain[p.domain].push(p)
  }

  const domains: ComputedScores['domains'] = {}
  const connectedSources = new Set<string>()
  let weightedSum = 0
  let activeWeight = 0
  let activeDomains = 0

  for (const domain of Object.keys(DOMAIN_WEIGHTS)) {
    const domainPoints = byDomain[domain] || []

    if (domainPoints.length > 0) {
      const avg = domainPoints.reduce((sum, p) => sum + p.normalized, 0) / domainPoints.length
      const score = Math.round(avg)
      const sources = Array.from(new Set(domainPoints.map(p => p.source)))
      sources.forEach(s => connectedSources.add(s))

      domains[domain] = { score, sources, dataPoints: domainPoints, hasData: true }

      weightedSum += score * (DOMAIN_WEIGHTS[domain] || 0)
      activeWeight += DOMAIN_WEIGHTS[domain] || 0
      activeDomains++
    } else {
      domains[domain] = { score: null, sources: [], dataPoints: [], hasData: false }
    }
  }

  const composite = activeWeight > 0
    ? Math.round((weightedSum / activeWeight) * 100) / 100
    : 0

  // Band thresholds — must match utils.ts getBand() and documentation
  // 0-25: LOW | 26-45: MODERATE | 46-65: ELEVATED | 66-80: HIGH | 81-100: CRITICAL
  let band = 'low'
  if (composite >= 81) band = 'critical'
  else if (composite >= 66) band = 'high'
  else if (composite >= 46) band = 'elevated'
  else if (composite >= 26) band = 'moderate'

  const allSources = ['BLS', 'FRED', 'World Bank', 'OECD', 'ACLED', 'O*NET', 'AI Index']
  const connected = Array.from(connectedSources)
  const missing = allSources.filter(s => !connectedSources.has(s))

  return {
    composite, domains, band, activeDomains,
    totalDomains: Object.keys(DOMAIN_WEIGHTS).length,
    sources_connected: connected, sources_missing: missing,
  }
}

// ═══════════════════════════════════════════════════════════
// Key Stat (headline number for homepage)
// ═══════════════════════════════════════════════════════════

export async function fetchKeyStat(): Promise<KeyStat> {
  const apiKey = process.env.FRED_API_KEY
  const FETCH_TIMEOUT = 10000 // 10s

  if (apiKey) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=ICSA&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
      const res = await withTimeout(fetch(url, { cache: 'no-store' }), FETCH_TIMEOUT, 'FRED-ICSA')
      if (res.ok) {
        const json = await res.json()
        const obs = json.observations?.[0]
        if (obs && obs.value !== '.') {
          const latest = parseInt(obs.value, 10)
          const formatted = latest >= 1000 ? `${(latest / 1000).toFixed(0)}K` : String(latest)
          return { value: formatted, label: 'initial jobless claims this week', source: `FRED / DOL — ${obs.date}`, raw: latest }
        }
      }
    } catch (e) { console.error('FRED key stat error:', e) }

    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
      const res = await withTimeout(fetch(url, { cache: 'no-store' }), FETCH_TIMEOUT, 'FRED-UNRATE')
      if (res.ok) {
        const json = await res.json()
        const obs = json.observations?.[0]
        if (obs && obs.value !== '.') {
          return { value: `${obs.value}%`, label: 'US unemployment rate', source: `FRED / BLS — ${obs.date}`, raw: parseFloat(obs.value) }
        }
      }
    } catch (e) { console.error('FRED UNRATE key stat error:', e) }
  }

  try {
    const currentYear = new Date().getFullYear()
    const body: Record<string, unknown> = {
      seriesid: ['LNS14000000'],
      startyear: String(currentYear - 1),
      endyear: String(currentYear),
    }
    if (process.env.BLS_API_KEY) body.registrationkey = process.env.BLS_API_KEY

    const res = await withTimeout(fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    }), FETCH_TIMEOUT, 'BLS-keyStat')
    if (res.ok) {
      const json = await res.json()
      const latest = json.Results?.series?.[0]?.data?.[0]
      if (latest) {
        return { value: `${latest.value}%`, label: 'US unemployment rate', source: `BLS — ${latest.year} ${latest.periodName}`, raw: parseFloat(latest.value) }
      }
    }
  } catch (e) { console.error('BLS key stat error:', e) }

  return { value: '—', label: 'data unavailable — connecting to sources', source: 'Waiting for API response', raw: 0 }
}
