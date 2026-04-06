import { fetchCorporateLayoffs } from '@/lib/corporateLayoffs'

export const revalidate = 14400 // cache 4 hours

const EMPTY_RESPONSE = {
  layoffs: [],
  totalAffected: 0,
  totalCompanies: 0,
  aiDrivenPercent: 0,
  topIndustries: [],
  lastUpdated: new Date().toISOString(),
  source: 'curated' as const,
}

export async function GET() {
  try {
    const data = await fetchCorporateLayoffs()
    return Response.json(data)
  } catch (error) {
    console.error('Corporate layoff data fetch error:', error)
    return Response.json(EMPTY_RESPONSE)
  }
}
