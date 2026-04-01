import { fetchAllSocialFeed } from '@/lib/socialFeed'

export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  try {
    const items = await fetchAllSocialFeed()
    return Response.json({ items, source: items.length > 0 ? 'live' : 'empty' })
  } catch (error) {
    console.error('Social feed fetch error:', error)
    return Response.json({ items: [], source: 'empty' })
  }
}
