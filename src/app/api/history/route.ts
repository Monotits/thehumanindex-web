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
  const parsed = parseInt(searchParams.get('months') || '6', 10)
  // NaN guard: ?months=abc önce NaN → limit(NaN) → 500 oluyordu.
  const months = Math.min(Number.isFinite(parsed) && parsed > 0 ? parsed : 6, 24)

  try {
    // En YENİ n ayı çek (önceden ascending+limit en eski n ayı döndürüyordu,
    // yani güncel ay asla listeye girmiyordu), sonra kronolojik sıraya çevir.
    const { data, error } = await supabase
      .from('monthly_scores')
      .select('*')
      .order('year_month', { ascending: false })
      .limit(months)

    if (error) throw error

    const rows = (data || []).reverse()

    return NextResponse.json({
      ok: true,
      months: rows,
      count: rows.length,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
