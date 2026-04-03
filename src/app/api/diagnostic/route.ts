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

export async function GET() {
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
          ? { ACLED_API_KEY: process.env.ACLED_API_KEY ? 'SET' : 'MISSING', ACLED_EMAIL: process.env.ACLED_EMAIL ? 'SET' : 'MISSING' }
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
