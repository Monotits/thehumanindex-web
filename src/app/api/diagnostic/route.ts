/**
 * GET /api/diagnostic — Test each data source individually and report results
 * Use this to debug which sources are working and which are failing silently
 */

import { NextResponse } from 'next/server'
import {
  fetchBLSData,
  fetchFREDData,
  fetchWorldBankData,
  fetchOECDData,
  fetchWHOData,
  fetchACLEDData,
  fetchONETData,
} from '@/lib/realData'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Direct test helpers for debugging specific sources
async function testWHO() {
  const url = 'https://ghoapi.azureedge.net/api/SDGSUICIDE?$filter=SpatialDim%20eq%20%27USA%27%20and%20Dim1%20eq%20%27BTSX%27&$orderby=TimeDim%20desc&$top=1'
  const res = await fetch(url, { cache: 'no-store' as RequestCache })
  const text = await res.text()
  return { status: res.status, bodyPreview: text.substring(0, 500), url }
}

async function testOECD() {
  const urls = [
    'https://sdmx.oecd.org/public/rest/data/OECD.WISE.WDP,DSD_BLI@DF_BLI,/A.USA.SW_LIFS..?format=jsondata',
    'https://stats.oecd.org/sdmx-json/data/BLI/USA.SW_LIFS.L.TOT/all?dimensionAtObservation=allDimensions',
  ]
  const results = []
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' as RequestCache })
      const text = await res.text()
      results.push({ url: url.substring(0, 80), status: res.status, bodyPreview: text.substring(0, 300) })
    } catch (err) {
      results.push({ url: url.substring(0, 80), error: String(err) })
    }
  }
  return results
}

async function testONET() {
  const apiKey = process.env.ONET_API_KEY
  if (!apiKey) return { error: 'ONET_API_KEY missing' }

  const url = 'https://api-v2.onetcenter.org/online/hot_technology?start=1&end=5'
  const res = await fetch(url, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
    cache: 'no-store' as RequestCache,
  })
  const text = await res.text()
  return { status: res.status, key: `${apiKey.substring(0, 8)}...`, bodyPreview: text.substring(0, 500), url }
}

async function testACLED() {
  const email = process.env.ACLED_EMAIL
  const password = process.env.ACLED_PASSWORD
  if (!email || !password) return { error: 'ACLED_EMAIL or ACLED_PASSWORD missing', email: email ? 'SET' : 'MISSING', password: password ? 'SET' : 'MISSING' }

  // Step 1: Test OAuth token
  let accessToken = ''
  try {
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
    const tokenText = await tokenRes.text()
    if (!tokenRes.ok) {
      return { step: 'oauth_token', status: tokenRes.status, error: tokenText.substring(0, 500) }
    }
    const tokenJson = JSON.parse(tokenText)
    accessToken = tokenJson.access_token
    if (!accessToken) {
      return { step: 'oauth_token', error: 'no access_token in response', response: tokenText.substring(0, 500) }
    }
  } catch (err) {
    return { step: 'oauth_token', error: String(err) }
  }

  // Step 2: Test API call
  try {
    const currentYear = new Date().getFullYear()
    const apiUrl = `https://acleddata.com/api/acled/read?event_type=Protests&event_type=Riots&country=United States&year=${currentYear}&limit=0`
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store' as RequestCache,
    })
    const text = await res.text()
    return {
      step: 'api_call',
      status: res.status,
      token: `${accessToken.substring(0, 10)}...`,
      url: apiUrl,
      bodyPreview: text.substring(0, 500),
    }
  } catch (err) {
    return { step: 'api_call', token: `${accessToken.substring(0, 10)}...`, error: String(err) }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const debug = searchParams.get('debug')

  // Debug specific source: /api/diagnostic?debug=who|oecd|onet|acled
  if (debug === 'who') return NextResponse.json(await testWHO())
  if (debug === 'oecd') return NextResponse.json(await testOECD())
  if (debug === 'onet') return NextResponse.json(await testONET())
  if (debug === 'acled') return NextResponse.json(await testACLED())

  const sources = [
    { name: 'BLS', fn: fetchBLSData },
    { name: 'FRED', fn: fetchFREDData },
    { name: 'World Bank', fn: fetchWorldBankData },
    { name: 'OECD', fn: fetchOECDData },
    { name: 'WHO', fn: fetchWHOData },
    { name: 'ACLED', fn: fetchACLEDData },
    { name: 'O*NET', fn: fetchONETData },
  ]

  const results = []

  for (const src of sources) {
    const start = Date.now()
    try {
      const points = await src.fn()
      results.push({
        source: src.name,
        status: points.length > 0 ? 'OK' : 'EMPTY',
        points: points.length,
        duration_ms: Date.now() - start,
        data: points.map(p => ({
          indicator: p.indicator,
          value: p.value,
          normalized: p.normalized,
          domain: p.domain,
        })),
        env_check: src.name === 'O*NET'
          ? { ONET_API_KEY: process.env.ONET_API_KEY ? `${process.env.ONET_API_KEY.substring(0, 5)}...` : 'MISSING' }
          : src.name === 'ACLED'
          ? { ACLED_EMAIL: process.env.ACLED_EMAIL ? 'SET' : 'MISSING', ACLED_PASSWORD: process.env.ACLED_PASSWORD ? 'SET' : 'MISSING' }
          : undefined,
      })
    } catch (err) {
      results.push({
        source: src.name,
        status: 'ERROR',
        error: String(err),
        duration_ms: Date.now() - start,
      })
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
