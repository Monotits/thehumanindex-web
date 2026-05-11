import { fetchCorporateLayoffs, CorporateLayoff, LayoffReason } from '@/lib/corporateLayoffs'
import { createClient } from '@supabase/supabase-js'

// Dynamic — never cache the route response. Underlying Supabase query is fast.
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CuratedRow {
  id: string
  company: string
  people_affected: number | null
  workforce_percent: number | null
  total_employees: number | null
  industry: string | null
  country: string | null
  reasons: string[] | null
  is_ai_driven: boolean
  announcement_date: string
  source_type: string
  source_name: string
  source_url: string
  headline: string
  excerpt: string | null
  confidence_score: number
}

interface Stats30d {
  total_companies: number
  total_affected: number
  ai_driven_events: number
  total_events: number
  ai_driven_percent: number
}

const EMPTY_RESPONSE = {
  layoffs: [],
  totalAffected: 0,
  totalCompanies: 0,
  aiDrivenPercent: 0,
  topIndustries: [],
  lastUpdated: new Date().toISOString(),
  source: 'curated' as const,
}

// Light industry lookup for items where Claude didn't supply one
const INDUSTRY_MAP: Record<string, string> = {
  Google: 'Tech', Alphabet: 'Tech', Microsoft: 'Tech', Amazon: 'Tech/Retail',
  Meta: 'Tech', Apple: 'Tech', Tesla: 'Automotive', Netflix: 'Entertainment',
  Spotify: 'Entertainment', Salesforce: 'Tech', IBM: 'Tech', Intel: 'Semiconductors',
  Cisco: 'Tech', Dell: 'Tech', HP: 'Tech', SAP: 'Enterprise Software',
  Oracle: 'Enterprise Software', Uber: 'Tech/Transport', Lyft: 'Tech/Transport',
  HSBC: 'Banking', 'Goldman Sachs': 'Finance', 'Morgan Stanley': 'Finance',
  JPMorgan: 'Finance', Citigroup: 'Banking', Citi: 'Banking',
  'Wells Fargo': 'Banking', 'Deutsche Bank': 'Banking', UBS: 'Banking',
  Deloitte: 'Consulting', Accenture: 'Consulting', EY: 'Consulting',
  PwC: 'Consulting', KPMG: 'Consulting', McKinsey: 'Consulting',
  Boeing: 'Aerospace', Ford: 'Automotive', GM: 'Automotive', Volkswagen: 'Automotive',
  Disney: 'Entertainment', Comcast: 'Telecom', 'AT&T': 'Telecom',
  Samsung: 'Tech', Sony: 'Tech', Siemens: 'Industrial',
  Shopify: 'E-commerce', Stripe: 'Fintech', Coinbase: 'Crypto',
  PayPal: 'Fintech', Zoom: 'Tech', UPS: 'Logistics', FedEx: 'Logistics',
  Unity: 'Gaming', EA: 'Gaming', ByteDance: 'Tech', TikTok: 'Tech',
}

function mapRowToLayoff(r: CuratedRow): CorporateLayoff {
  const validReasons: LayoffReason[] = (r.reasons || []).filter(x =>
    ['AI_DRIVEN', 'RESTRUCTURING', 'WEAK_DEMAND', 'COST_CUTTING', 'AUTOMATION', 'MERGER', 'MARKET_SHIFT'].includes(x)
  ) as LayoffReason[]
  const isNew = (Date.now() - new Date(r.announcement_date).getTime()) < 7 * 24 * 60 * 60 * 1000
  return {
    company: r.company,
    peopleAffected: r.people_affected ?? 0,
    workforcePercent: r.workforce_percent,
    totalEmployees: r.total_employees,
    industry: r.industry || INDUSTRY_MAP[r.company] || 'Other',
    reason: validReasons.length > 0 ? validReasons : ['RESTRUCTURING'],
    date: new Date(r.announcement_date).toISOString(),
    source: r.source_name,
    sourceUrl: r.source_url,
    isNew,
    country: r.country || 'US',
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ── Try curated (Claude-extracted) feed first ──
  if (url && anon) {
    try {
      const sb = createClient(url, anon)
      const [recentRes, statsRes] = await Promise.all([
        sb.from('v_corporate_layoffs_recent').select('*').limit(50),
        sb.from('v_corporate_layoffs_stats_30d').select('*').limit(1),
      ])

      const rows = (recentRes.data as CuratedRow[] | null) || []
      if (rows.length > 0) {
        const layoffs = rows.map(mapRowToLayoff).sort((a, b) => b.peopleAffected - a.peopleAffected)
        const stats = (statsRes.data as Stats30d[] | null)?.[0]

        const industryMap = new Map<string, number>()
        for (const l of layoffs) {
          industryMap.set(l.industry, (industryMap.get(l.industry) || 0) + l.peopleAffected)
        }
        const topIndustries = Array.from(industryMap.entries())
          .map(([name, affected]) => ({ name, affected }))
          .sort((a, b) => b.affected - a.affected)
          .slice(0, 6)

        return Response.json({
          layoffs: layoffs.slice(0, 25),
          totalAffected: stats?.total_affected ?? layoffs.reduce((s, l) => s + l.peopleAffected, 0),
          totalCompanies: stats?.total_companies ?? layoffs.length,
          aiDrivenPercent: stats?.ai_driven_percent ?? 0,
          topIndustries,
          lastUpdated: new Date().toISOString(),
          source: 'curated' as const,
        })
      }
    } catch (err) {
      console.warn('Corporate layoffs curated read failed, falling back to live fetch:', err)
    }
  }

  // ── Fallback: legacy live regex pipeline (kept for resiliency) ──
  try {
    const data = await fetchCorporateLayoffs()
    return Response.json(data)
  } catch (error) {
    console.error('Corporate layoff data fetch error:', error)
    return Response.json(EMPTY_RESPONSE)
  }
}
