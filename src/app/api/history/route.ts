/**
 * GET /api/history — Returns monthly score history from Supabase
 * Optional ?months=6 param (default 6, max 24)
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const months = Math.min(parseInt(searchParams.get('months') || '6', 10), 24)

  try {
    const { data, error } = await supabase
      .from('monthly_scores')
      .select('*')
      .order('year_month', { ascending: true })
      .limit(months)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      months: data || [],
      count: data?.length || 0,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
