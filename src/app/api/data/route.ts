import { fetchAllRealData, computeScores } from '@/lib/realData'

export const revalidate = 86400 // cache 24 hours

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
