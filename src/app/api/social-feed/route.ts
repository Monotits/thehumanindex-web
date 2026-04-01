import { fetchAllSocialFeed, FALLBACK_SOCIAL_FEED } from '@/lib/socialFeed'

export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  try {
    const items = await fetchAllSocialFeed()

    if (items.length === 0) {
      // If live fetch returned nothing, use fallback
      return Response.json({ items: FALLBACK_SOCIAL_FEED, source: 'fallback' })
    }

    return Response.json({ items, source: 'live' })
  } catch (error) {
    console.error('Social feed fetch error:', error)
    return Response.json({ items: FALLBACK_SOCIAL_FEED, source: 'fallback' })
  }
}
