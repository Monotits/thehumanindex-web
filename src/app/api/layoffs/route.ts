import { fetchAllLayoffs, FALLBACK_LAYOFFS } from '@/lib/layoffData'

export const revalidate = 3600 // cache 1 hour

export async function GET() {
  try {
    const data = await fetchAllLayoffs()

    if (data.events.length === 0) {
      return Response.json(FALLBACK_LAYOFFS)
    }

    return Response.json(data)
  } catch (error) {
    console.error('Layoff data fetch error:', error)
    return Response.json(FALLBACK_LAYOFFS)
  }
}
