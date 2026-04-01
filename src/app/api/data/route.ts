import { fetchAllRealData, computeScores } from '@/lib/realData'

export const revalidate = 86400 // cache 24 hours

// Mock fallback scores (used for domains with no real data yet)
const MOCK_FALLBACKS: Record<string, number> = {
  work_risk: 72,
  inequality: 64,
  unrest: 51,
  decay: 43,
  wellbeing: 38,
  policy: 55,
  sentiment: 62,
}

export async function GET() {
  try {
    const { points, errors } = await fetchAllRealData()
    const scores = computeScores(points, MOCK_FALLBACKS)

    return Response.json({
      scores,
      raw_points: points,
      errors,
      fetched_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Data pipeline error:', error)
    return Response.json({
      scores: null,
      raw_points: [],
      errors: [String(error)],
      fetched_at: new Date().toISOString(),
    }, { status: 500 })
  }
}
