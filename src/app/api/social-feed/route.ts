import { fetchAllSocialFeed, SocialFeedItem } from '@/lib/socialFeed'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // cache for 1 hour

interface CuratedRow {
  id: string
  source: 'reddit' | 'news' | 'x'
  source_name: string
  source_icon: string | null
  title: string
  body: string | null
  url: string
  author: string | null
  raw_score: number
  relevance_score: number | null
  why_matters: string | null
  domain_tags: string[] | null
  published_at: string
  fetched_at: string
  enriched_at: string | null
}

/**
 * Try to read LLM-enriched items from Supabase first (populated by PD dashboard).
 * Fall back to live fetch if the table is empty or unavailable.
 */
export async function GET() {
  // ── Try curated (LLM-enriched) feed first ──
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && anon) {
    try {
      const sb = createClient(url, anon)
      const { data, error } = await sb
        .from('v_social_feed_recent')
        .select('*')
        .limit(40)

      if (!error && data && data.length > 0) {
        const items: SocialFeedItem[] = (data as CuratedRow[]).map(r => ({
          id: r.id,
          source: r.source,
          source_name: r.source_name,
          source_icon: r.source_icon ?? '📰',
          title: r.title,
          body: r.why_matters || r.body || '',  // prefer Claude's editorial summary
          url: r.url,
          author: r.author ?? '',
          score: r.raw_score,
          published_at: r.published_at,
          fetched_at: r.fetched_at,
          // extension fields (not in interface yet — reader can ignore)
          ...(r.relevance_score !== null && { relevance_score: r.relevance_score }),
          ...(r.why_matters && { why_matters: r.why_matters }),
          ...(r.domain_tags && r.domain_tags.length > 0 && { domain_tags: r.domain_tags }),
        } as SocialFeedItem))
        return Response.json({ items, source: 'curated' })
      }
    } catch (err) {
      console.warn('Curated feed read failed, falling back to live fetch:', err)
    }
  }

  // ── Fallback: live regex-filtered fetch ──
  try {
    const items = await fetchAllSocialFeed()
    return Response.json({ items, source: items.length > 0 ? 'live' : 'empty' })
  } catch (error) {
    console.error('Social feed fetch error:', error)
    return Response.json({ items: [], source: 'empty' })
  }
}
