/**
 * Layoff Data Aggregator
 * Pulls layoff-related content from Reddit, RSS news feeds, and public APIs.
 * Provides structured layoff event data for the Layoff Tracker dashboard.
 */

export interface LayoffEvent {
  id: string
  company: string
  count: number | null         // number of employees affected (null if unknown)
  industry: string
  source: 'reddit' | 'news' | 'government'
  source_name: string
  source_url: string
  headline: string
  excerpt: string
  published_at: string
  fetched_at: string
}

export interface LayoffSummary {
  events: LayoffEvent[]
  stats: {
    total_affected_30d: number
    total_events_30d: number
    top_industries: { name: string; count: number }[]
    trend: 'increasing' | 'stable' | 'decreasing'
  }
  source: 'live' | 'fallback'
}

// ── Layoff keyword matching ──────────────────────────────────

const LAYOFF_KEYWORDS = /\b(layoff|laid off|lay off|laying off|job cut|workforce reduction|downsiz|restructur|rif\b|reduction in force|mass firing|let go|eliminated.*position|headcount reduction|severance|pink slip)\b/i

const COMPANY_EXTRACT = /\b(Google|Microsoft|Amazon|Meta|Apple|Tesla|Netflix|Spotify|Salesforce|IBM|Intel|Cisco|Dell|HP|SAP|Oracle|Uber|Lyft|DoorDash|Snap|X Corp|Twitter|ByteDance|TikTok|Samsung|Sony|Philips|Siemens|Boeing|Ford|GM|Goldman Sachs|Morgan Stanley|JPMorgan|Citi|Wells Fargo|Deutsche Bank|UBS|HSBC|Deloitte|McKinsey|Accenture|EY|PwC|KPMG|Shopify|Stripe|Coinbase|Robinhood|PayPal|Block|Square|Twilio|Zoom|Slack|DocuSign|Atlassian|Unity|Epic Games|EA|Activision|Blizzard|Riot Games|BuzzFeed|Vice|CNN|Disney|Warner Bros|Paramount|Fox|NBCUniversal|Comcast|AT&T|Verizon|T-Mobile)\b/i

const COUNT_EXTRACT = /(\d{1,3}(?:,\d{3})*)\s*(?:employee|worker|staff|job|position|people|role|layoff|cut)/i
const INDUSTRY_MAP: Record<string, string> = {
  'Google': 'Tech', 'Microsoft': 'Tech', 'Amazon': 'Tech', 'Meta': 'Tech', 'Apple': 'Tech',
  'Tesla': 'Automotive', 'Netflix': 'Entertainment', 'Spotify': 'Entertainment',
  'Salesforce': 'Tech', 'IBM': 'Tech', 'Intel': 'Tech', 'Cisco': 'Tech',
  'Dell': 'Tech', 'HP': 'Tech', 'SAP': 'Tech', 'Oracle': 'Tech',
  'Uber': 'Tech', 'Lyft': 'Tech', 'DoorDash': 'Tech',
  'Snap': 'Tech', 'X Corp': 'Tech', 'Twitter': 'Tech',
  'ByteDance': 'Tech', 'TikTok': 'Tech',
  'Goldman Sachs': 'Finance', 'Morgan Stanley': 'Finance', 'JPMorgan': 'Finance',
  'Citi': 'Finance', 'Wells Fargo': 'Finance', 'Deutsche Bank': 'Finance',
  'UBS': 'Finance', 'HSBC': 'Finance',
  'Deloitte': 'Consulting', 'McKinsey': 'Consulting', 'Accenture': 'Consulting',
  'EY': 'Consulting', 'PwC': 'Consulting', 'KPMG': 'Consulting',
  'Shopify': 'Tech', 'Stripe': 'Tech', 'Coinbase': 'Crypto',
  'Robinhood': 'Finance', 'PayPal': 'Finance', 'Block': 'Finance',
  'Twilio': 'Tech', 'Zoom': 'Tech', 'Slack': 'Tech',
  'DocuSign': 'Tech', 'Atlassian': 'Tech',
  'Unity': 'Gaming', 'Epic Games': 'Gaming', 'EA': 'Gaming',
  'Activision': 'Gaming', 'Blizzard': 'Gaming', 'Riot Games': 'Gaming',
  'BuzzFeed': 'Media', 'Vice': 'Media', 'CNN': 'Media',
  'Disney': 'Entertainment', 'Warner Bros': 'Entertainment', 'Paramount': 'Entertainment',
  'Fox': 'Media', 'NBCUniversal': 'Media', 'Comcast': 'Telecom',
  'AT&T': 'Telecom', 'Verizon': 'Telecom', 'T-Mobile': 'Telecom',
  'Boeing': 'Aerospace', 'Ford': 'Automotive', 'GM': 'Automotive',
  'Samsung': 'Tech', 'Sony': 'Tech', 'Philips': 'Tech', 'Siemens': 'Industrial',
}

function extractCompany(text: string): string {
  const match = COMPANY_EXTRACT.exec(text)
  return match ? match[1] : 'Unknown'
}

function extractCount(text: string): number | null {
  const countMatch = COUNT_EXTRACT.exec(text)
  if (countMatch) {
    return parseInt(countMatch[1].replace(/,/g, ''), 10)
  }
  return null
}

function guessIndustry(company: string, text: string): string {
  if (INDUSTRY_MAP[company]) return INDUSTRY_MAP[company]
  const lower = text.toLowerCase()
  if (/tech|software|ai|saas|cloud/i.test(lower)) return 'Tech'
  if (/financ|bank|invest|trading/i.test(lower)) return 'Finance'
  if (/media|news|journal|publish/i.test(lower)) return 'Media'
  if (/health|pharma|biotech|medical/i.test(lower)) return 'Healthcare'
  if (/retail|ecommerce|shop/i.test(lower)) return 'Retail'
  if (/game|gaming/i.test(lower)) return 'Gaming'
  if (/auto|vehicle|ev\b/i.test(lower)) return 'Automotive'
  if (/energy|oil|solar|green/i.test(lower)) return 'Energy'
  return 'Other'
}

// ── Reddit layoff fetcher ──────────────────────────────────

const LAYOFF_SUBREDDITS = [
  'layoffs',
  'technology',
  'cscareerquestions',
  'antiwork',
  'news',
  'business',
  'economics',
]

export async function fetchRedditLayoffs(limit = 20): Promise<LayoffEvent[]> {
  const events: LayoffEvent[] = []

  for (const sub of LAYOFF_SUBREDDITS) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'TheHumanIndex/1.0' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue

      const data = await res.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        const p = post.data
        const fullText = `${p.title} ${p.selftext?.slice(0, 800) || ''}`

        if (!LAYOFF_KEYWORDS.test(fullText)) continue

        const company = extractCompany(fullText)
        const count = extractCount(fullText)

        events.push({
          id: `reddit-layoff-${p.id}`,
          company,
          count,
          industry: guessIndustry(company, fullText),
          source: 'reddit',
          source_name: `r/${p.subreddit}`,
          source_url: `https://reddit.com${p.permalink}`,
          headline: p.title,
          excerpt: p.selftext
            ? p.selftext.slice(0, 200).replace(/\n/g, ' ').trim() + (p.selftext.length > 200 ? '...' : '')
            : '',
          published_at: new Date(p.created_utc * 1000).toISOString(),
          fetched_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error(`Layoff Reddit fetch failed for r/${sub}:`, err)
    }
  }

  return events
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit)
}

// ── RSS layoff news fetcher ──────────────────────────────────

const LAYOFF_RSS_FEEDS = [
  { name: 'TechCrunch Layoffs', url: 'https://techcrunch.com/tag/layoffs/feed/', icon: '📱' },
  { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', icon: '📰' },
  { name: 'Hacker News Layoffs', url: 'https://hnrss.org/newest?q=layoff+OR+%22laid+off%22+OR+%22job+cuts%22&points=30', icon: '🟠' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', icon: '🔬' },
]

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

export async function fetchRSSLayoffs(limit = 15): Promise<LayoffEvent[]> {
  const events: LayoffEvent[] = []

  for (const feed of LAYOFF_RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'TheHumanIndex/1.0' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue

      const xml = await res.text()
      const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi
      let match

      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1]
        const title = extractTag(block, 'title')
        const link = extractTag(block, 'link') || extractAttr(block, 'link', 'href')
        const description = extractTag(block, 'description') || extractTag(block, 'summary') || ''
        const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'published') || ''
        const fullText = `${title} ${description}`

        if (!LAYOFF_KEYWORDS.test(fullText)) continue

        const cleanBody = description
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .slice(0, 200).trim()

        const company = extractCompany(fullText)

        events.push({
          id: `news-layoff-${hashStr(title + link)}`,
          company,
          count: extractCount(fullText),
          industry: guessIndustry(company, fullText),
          source: 'news',
          source_name: feed.name,
          source_url: link || '',
          headline: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          excerpt: cleanBody + (cleanBody.length >= 200 ? '...' : ''),
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          fetched_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error(`Layoff RSS fetch failed for ${feed.name}:`, err)
    }
  }

  return events
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit)
}

function hashStr(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

// ── Combined fetch + summary builder ──────────────────────────

export async function fetchAllLayoffs(): Promise<LayoffSummary> {
  const [reddit, rss] = await Promise.all([
    fetchRedditLayoffs(15),
    fetchRSSLayoffs(10),
  ])

  const events = [...reddit, ...rss]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 30)

  // Deduplicate by similar headline
  const seen = new Set<string>()
  const deduped = events.filter(e => {
    const key = e.headline.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Build stats
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recent = deduped.filter(e => new Date(e.published_at).getTime() > thirtyDaysAgo)

  const industryCount: Record<string, number> = {}
  let totalAffected = 0
  for (const e of recent) {
    if (e.count) totalAffected += e.count
    industryCount[e.industry] = (industryCount[e.industry] || 0) + 1
  }

  const topIndustries = Object.entries(industryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    events: deduped,
    stats: {
      total_affected_30d: totalAffected,
      total_events_30d: recent.length,
      top_industries: topIndustries,
      trend: recent.length > 10 ? 'increasing' : recent.length > 5 ? 'stable' : 'decreasing',
    },
    source: deduped.length > 0 ? 'live' : 'fallback',
  }
}

// ── Fallback data ──────────────────────────────────────────

export const FALLBACK_LAYOFFS: LayoffSummary = {
  events: [
    {
      id: 'fallback-layoff-1',
      company: 'Meta',
      count: 3600,
      industry: 'Tech',
      source: 'news',
      source_name: 'Reuters',
      source_url: 'https://reuters.com',
      headline: 'Meta cuts 3,600 jobs in latest round of AI-driven restructuring',
      excerpt: 'Meta Platforms announced a new round of layoffs affecting approximately 5% of its workforce, as the company continues to shift resources toward AI development...',
      published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-2',
      company: 'Google',
      count: 1200,
      industry: 'Tech',
      source: 'news',
      source_name: 'TechCrunch',
      source_url: 'https://techcrunch.com',
      headline: 'Google lays off 1,200 from Cloud and Ads divisions amid automation push',
      excerpt: 'The cuts primarily target mid-level roles that Google says can now be partially handled by internal AI systems...',
      published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-3',
      company: 'Salesforce',
      count: 700,
      industry: 'Tech',
      source: 'reddit',
      source_name: 'r/layoffs',
      source_url: 'https://reddit.com/r/layoffs',
      headline: 'Salesforce eliminates 700 positions as Agentforce AI platform scales',
      excerpt: 'Salesforce CEO announced the company will redeploy savings into AI agent development, calling it a "fundamental shift in how enterprise software is delivered"...',
      published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-4',
      company: 'Intel',
      count: 5000,
      industry: 'Tech',
      source: 'news',
      source_name: 'Ars Technica',
      source_url: 'https://arstechnica.com',
      headline: 'Intel announces 5,000 more job cuts as foundry strategy pivot continues',
      excerpt: 'The struggling chipmaker is now down 30% from its peak workforce, with manufacturing and design roles bearing the brunt of the cuts...',
      published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-5',
      company: 'Goldman Sachs',
      count: 1500,
      industry: 'Finance',
      source: 'news',
      source_name: 'Reuters',
      source_url: 'https://reuters.com',
      headline: 'Goldman Sachs cuts 1,500 middle-office roles, citing AI automation',
      excerpt: 'The bank has deployed AI systems that now handle 70% of routine compliance checks and reporting tasks previously done by human analysts...',
      published_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-6',
      company: 'Disney',
      count: 2000,
      industry: 'Entertainment',
      source: 'reddit',
      source_name: 'r/technology',
      source_url: 'https://reddit.com/r/technology',
      headline: 'Disney lays off 2,000 across streaming and linear TV divisions',
      excerpt: 'The entertainment giant is consolidating operations as AI-generated content tools reduce the need for post-production and content moderation staff...',
      published_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-7',
      company: 'Cisco',
      count: 4000,
      industry: 'Tech',
      source: 'news',
      source_name: 'Hacker News',
      source_url: 'https://news.ycombinator.com',
      headline: 'Cisco announces second round of layoffs in 2026, cutting 4,000 jobs',
      excerpt: 'Networking giant continues shift from hardware to AI-powered software services, with sales and support teams most affected...',
      published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
    {
      id: 'fallback-layoff-8',
      company: 'Accenture',
      count: 8000,
      industry: 'Consulting',
      source: 'news',
      source_name: 'Reuters',
      source_url: 'https://reuters.com',
      headline: 'Accenture to cut 8,000 roles globally as AI replaces junior consulting work',
      excerpt: 'The consulting firm says AI can now perform 60% of entry-level analysis work, fundamentally changing the pyramid staffing model that defined the industry...',
      published_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    },
  ],
  stats: {
    total_affected_30d: 26000,
    total_events_30d: 8,
    top_industries: [
      { name: 'Tech', count: 5 },
      { name: 'Finance', count: 1 },
      { name: 'Entertainment', count: 1 },
      { name: 'Consulting', count: 1 },
    ],
    trend: 'increasing',
  },
  source: 'fallback',
}
