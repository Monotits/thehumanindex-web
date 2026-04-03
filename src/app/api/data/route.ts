import { fetchAllRealData, computeScores } from '@/lib/realData'

// Force dynamic — do NOT pre-render at build time (API calls would timeout)
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30 // Allow up to 30s for external API calls

export async function GET() {
  try {
    const { points, errors } = await fetchAllRealData()
    const scores = computeScores(points)

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
