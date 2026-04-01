import { fetchAllLayoffs } from '@/lib/layoffData'

export const revalidate = 3600 // cache 1 hour

const EMPTY_RESPONSE = {
  events: [],
  stats: { total_affected_30d: 0, total_events_30d: 0, trend: 'stable' as const, top_industries: [] },
  source: 'empty',
}

export async function GET() {
  try {
    const data = await fetchAllLayoffs()
    return Response.json(data)
  } catch (error) {
    console.error('Layoff data fetch error:', error)
    return Response.json(EMPTY_RESPONSE)
  }
}
