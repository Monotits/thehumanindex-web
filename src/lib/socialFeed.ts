/**
 * Social Feed Aggregator
 * Pulls content from Reddit (public JSON API) and News RSS feeds
 * relevant to AI displacement, labor economics, and civilizational stress.
 */

export interface SocialFeedItem {
  id: string
  source: 'reddit' | 'news' | 'x'
  source_name: string     // e.g. "r/economics", "Reuters", "@econpolicy"
  source_icon: string     // emoji or identifier
  title: string
  body: string            // excerpt or comment text
  url: string
  author: string
  score: number           // upvotes or relevance score
  published_at: string    // ISO date
  fetched_at: string
}

// ── Reddit fetcher ──────────────────────────────────────────

const REDDIT_SUBREDDITS = [
  'artificial',
  'economics',
  'technology',
  'Futurology',
  'antiwork',
  'MachineLearning',
  'singularity',
]

const AI_KEYWORDS = /\b(ai|artificial intelligence|automation|job(s)?(\s+loss)?|displacement|layoff|gpt|llm|chatbot|robot|unemploy|workforce|labor market|income inequality|wage|skill gap)\b/i

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    url: string
    author: string
    score: number
    subreddit: string
    created_utc: number
    num_comments: number
    permalink: string
  }
}

export async function fetchRedditPosts(limit = 20): Promise<SocialFeedItem[]> {
  const items: SocialFeedItem[] = []

  for (const sub of REDDIT_SUBREDDITS) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
        headers: { 'User-Agent': 'TheHumanIndex/1.0' },
        next: { revalidate: 3600 },
      })

      if (!res.ok) continue

      const data = await res.json()
      const posts: RedditPost[] = data?.data?.children || []

      for (const post of posts) {
        const p = post.data
        // Filter for AI/labor relevance
        if (!AI_KEYWORDS.test(p.title) && !AI_KEYWORDS.test(p.selftext?.slice(0, 500) || '')) continue

        items.push({
          id: `reddit-${p.id}`,
          source: 'reddit',
          source_name: `r/${p.subreddit}`,
          source_icon: '💬',
          title: p.title,
          body: p.selftext
            ? p.selftext.slice(0, 280).replace(/\n/g, ' ').trim() + (p.selftext.length > 280 ? '...' : '')
            : '',
          url: p.url.startsWith('/') ? `https://reddit.com${p.permalink}` : `https://reddit.com${p.permalink}`,
          author: `u/${p.author}`,
          score: p.score,
          published_at: new Date(p.created_utc * 1000).toISOString(),
          fetched_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error(`Reddit fetch failed for r/${sub}:`, err)
    }
  }

  // Sort by score (engagement), take top N
  return items
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// ── RSS News fetcher ──────────────────────────────────────────

interface RSSFeed {
  name: string
  url: string
  icon: string
}

const RSS_FEEDS: RSSFeed[] = [
  { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', icon: '📰' },
  { name: 'Ars Technica AI', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', icon: '🔬' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', icon: '🧪' },
  { name: 'Hacker News', url: 'https://hnrss.org/newest?q=AI+jobs+automation+displacement&points=50', icon: '🟠' },
  { name: 'World Economic Forum', url: 'https://www.weforum.org/feed/rss', icon: '🌐' },
]

/**
 * Minimal RSS XML parser — extracts items from RSS/Atom feeds
 * without requiring an external XML library.
 */
function parseRSSItems(xml: string, feedName: string, icon: string): SocialFeedItem[] {
  const items: SocialFeedItem[] = []

  // Match <item> or <entry> blocks
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]

    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link') || extractAttr(block, 'link', 'href')
    const description = extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content:encoded') || ''
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || ''
    const author = extractTag(block, 'dc:creator') || extractTag(block, 'author') || feedName

    if (!title || !AI_KEYWORDS.test(title) && !AI_KEYWORDS.test(description.slice(0, 300))) continue

    // Strip HTML tags from description
    const cleanBody = description
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .slice(0, 280)
      .trim()

    items.push({
      id: `news-${hashCode(title + link)}`,
      source: 'news',
      source_name: feedName,
      source_icon: icon,
      title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      body: cleanBody + (cleanBody.length >= 280 ? '...' : ''),
      url: link || '',
      author,
      score: 0, // no score for news
      published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      fetched_at: new Date().toISOString(),
    })
  }

  return items
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = regex.exec(xml)
  return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i')
  const match = regex.exec(xml)
  return match ? match[1] : ''
}

function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export async function fetchNewsPosts(limit = 15): Promise<SocialFeedItem[]> {
  const items: SocialFeedItem[] = []

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'TheHumanIndex/1.0' },
        next: { revalidate: 3600 },
      })

      if (!res.ok) continue

      const xml = await res.text()
      const feedItems = parseRSSItems(xml, feed.name, feed.icon)
      items.push(...feedItems)
    } catch (err) {
      console.error(`RSS fetch failed for ${feed.name}:`, err)
    }
  }

  // Sort by date (newest first), take top N
  return items
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit)
}

// ── Combined fetcher ──────────────────────────────────────────

export async function fetchAllSocialFeed(): Promise<SocialFeedItem[]> {
  const [reddit, news] = await Promise.all([
    fetchRedditPosts(12),
    fetchNewsPosts(8),
  ])

  // Interleave: alternate reddit and news, with reddit having priority
  const combined: SocialFeedItem[] = []
  let ri = 0, ni = 0
  while (ri < reddit.length || ni < news.length) {
    if (ri < reddit.length) combined.push(reddit[ri++])
    if (ri < reddit.length) combined.push(reddit[ri++])
    if (ni < news.length) combined.push(news[ni++])
  }

  return combined.slice(0, 20)
}

// ── Fallback static data ──────────────────────────────────────

export const FALLBACK_SOCIAL_FEED: SocialFeedItem[] = [
  {
    id: 'fallback-1',
    source: 'reddit',
    source_name: 'r/economics',
    source_icon: '💬',
    title: 'New JOLTS data shows a 23% decline in mid-level knowledge worker openings since Q3 2025',
    body: 'The latest BLS JOLTS report paints a concerning picture. While overall job openings remain stable, the composition has shifted dramatically toward service and healthcare roles...',
    url: 'https://reddit.com/r/economics',
    author: 'u/labordata_nerd',
    score: 2847,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    source: 'news',
    source_name: 'Reuters',
    source_icon: '📰',
    title: 'Global AI spending to reach $680B in 2026, McKinsey report finds',
    body: 'Enterprise AI investment is accelerating faster than any previous technology cycle, with financial services and healthcare leading adoption rates...',
    url: 'https://reuters.com',
    author: 'Reuters',
    score: 0,
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    source: 'reddit',
    source_name: 'r/antiwork',
    source_icon: '💬',
    title: 'My entire department of 14 was replaced by an AI system last month. None of us saw it coming.',
    body: 'I worked in claims processing at a mid-size insurance company for 8 years. Last month they brought in an AI vendor, gave us 2 weeks notice, and now a team of 3 oversees what 14 of us used to do...',
    url: 'https://reddit.com/r/antiwork',
    author: 'u/displaced_and_confused',
    score: 18420,
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-4',
    source: 'news',
    source_name: 'MIT Tech Review',
    source_icon: '🧪',
    title: 'The skills gap isn\'t closing — it\'s splitting',
    body: 'New analysis suggests that AI is creating two distinct labor markets: one for workers who can leverage AI tools effectively, and one for everyone else...',
    url: 'https://technologyreview.com',
    author: 'MIT Technology Review',
    score: 0,
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-5',
    source: 'reddit',
    source_name: 'r/artificial',
    source_icon: '💬',
    title: 'The Human Index just hit 58. For context, it was 41 six months ago.',
    body: 'Been tracking this since launch. The acceleration is real — every single sub-index except Wellbeing has increased. Work Risk at 72 is particularly alarming given the Q1 jobs data...',
    url: 'https://reddit.com/r/artificial',
    author: 'u/index_watcher',
    score: 3291,
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-6',
    source: 'reddit',
    source_name: 'r/Futurology',
    source_icon: '💬',
    title: 'South Korea just committed $4.2B to AI workforce transition. Where is the US equivalent?',
    body: 'The Qualifizierungschancengesetz in Germany, Korea\'s AI Transition Fund, and the EU\'s targeted programs all dwarf US efforts. Federal retraining spending increased just 4% nominally...',
    url: 'https://reddit.com/r/Futurology',
    author: 'u/policy_wonk_2026',
    score: 5102,
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-7',
    source: 'news',
    source_name: 'Ars Technica',
    source_icon: '🔬',
    title: 'Survey: 74% of workers aged 35-54 report "significant AI anxiety"',
    body: 'The American Psychological Association\'s annual Stress in America survey reveals the sharpest one-year increase in occupational anxiety since tracking began...',
    url: 'https://arstechnica.com',
    author: 'Ars Technica',
    score: 0,
    published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'fallback-8',
    source: 'reddit',
    source_name: 'r/technology',
    source_icon: '💬',
    title: 'Freelance translators report 80% income decline in 12 months. The displacement is real and it\'s quiet.',
    body: 'I\'ve been a professional translator (EN/DE/FR) for 15 years. My annual income went from $94K to $18K. The agencies I worked with all switched to AI + a single human reviewer...',
    url: 'https://reddit.com/r/technology',
    author: 'u/translator_no_more',
    score: 12840,
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
  },
]
