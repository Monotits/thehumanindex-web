/**
 * GET /api/pulse
 *
 * Public listing of pulses (commentary). Filters: country, locale, type.
 * Defaults to type=weekly_pulse for the most common use case.
 *
 * Query params:
 *   country   — ISO2 or 'global'. Default: any (no filter).
 *   locale    — BCP-47. Default 'en'.
 *   type      — 'weekly_pulse' (default) | 'monthly_brief' | etc.
 *   limit     — max rows (default 20, capped at 100)
 *   offset    — pagination offset
 *   latest    — 'per_country' returns one row per country (uses
 *               v_commentary_latest_per_country view)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const MAX_LIMIT = 100;

interface PulseListRow {
  id: string;
  country_code: string | null;
  locale: string | null;
  type: string | null;
  title: string;
  slug: string;
  composite_score_id: string | null;
  published_at: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') || 'en').toLowerCase();
  const country = (url.searchParams.get('country') || '').toUpperCase();
  const type = url.searchParams.get('type') || 'weekly_pulse';
  const limit = Math.min(
    Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20,
    MAX_LIMIT
  );
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);
  const latestMode = url.searchParams.get('latest') === 'per_country';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const sb = createClient(supabaseUrl, anonKey);

  const tableOrView = latestMode ? 'v_commentary_latest_per_country' : 'commentary';

  let q = sb
    .from(tableOrView)
    .select(
      'id,country_code,locale,type,title,slug,composite_score_id,published_at',
      { count: 'exact' }
    )
    .eq('locale', locale)
    .eq('type', type);

  const countryFilter = country === 'GLOBAL' ? 'global' : country;
  if (countryFilter) q = q.eq('country_code', countryFilter);

  q = q
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      filters: { locale, country: countryFilter || null, type, latest_mode: latestMode },
      total: count ?? (data ?? []).length,
      offset,
      limit,
      pulses: (data ?? []) as PulseListRow[],
    },
    {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    }
  );
}
