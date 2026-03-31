import type { Metadata } from 'next'
import { MOCK_COMPOSITE_SCORE, MOCK_COMMENTARIES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { CompositeScore, Commentary } from '@/lib/types'
import HomeRouter from '@/components/home/HomeRouter'

export const metadata: Metadata = {
  alternates: { canonical: 'https://thehumanindex.org' },
}

// ISR revalidation every 24 hours
export const revalidate = 86400

async function getLatestScore(): Promise<CompositeScore> {
  try {
    const { data, error } = await supabase
      .from('composite_scores')
      .select('*, sub_indexes(*)')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1)

    if (error) throw error
    if (data && data.length > 0) return data[0] as CompositeScore
  } catch (e) {
    console.error('Failed to fetch score:', e)
  }
  return MOCK_COMPOSITE_SCORE
}

async function getLatestPulse(): Promise<Commentary> {
  try {
    const { data, error } = await supabase
      .from('commentary')
      .select('*')
      .eq('type', 'weekly_pulse')
      .order('published_at', { ascending: false })
      .limit(1)

    if (error) throw error
    if (data && data.length > 0) return data[0] as Commentary
  } catch (e) {
    console.error('Failed to fetch pulse:', e)
  }
  return MOCK_COMMENTARIES[0]
}

export default async function Home() {
  const [score, pulse] = await Promise.all([
    getLatestScore(),
    getLatestPulse(),
  ])

  return <HomeRouter score={score} pulse={pulse} />
}
