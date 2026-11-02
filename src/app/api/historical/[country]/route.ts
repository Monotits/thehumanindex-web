/**
 * GET /api/historical/{iso2} — Historical structural index (HSI), annual.
 * Optional ?indicators=1 adds the underlying World Bank observations.
 */

import { NextResponse } from 'next/server';
import { anonClient } from '@/lib/live/present';

export const revalidate = 86400;

export async function GET(req: Request, { params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const cc = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return NextResponse.json({ ok: false, error: 'Invalid country code' }, { status: 400 });
  const sb = await anonClient();
  if (!sb) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });

  const withIndicators = new URL(req.url).searchParams.get('indicators') === '1';
  const [scoresRes, valuesRes] = await Promise.all([
    sb.from('historical_scores').select('year, composite, meta, indicators_used, indicators_total, method_version, computed_at')
      .eq('country_code', cc).order('year', { ascending: true }),
    withIndicators
      ? sb.from('historical_indicator_values').select('indicator_id, year, raw_value, normalized_value, source')
          .eq('country_code', cc).gte('year', 2000).order('indicator_id').order('year')
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (scoresRes.error || valuesRes.error) {
    return NextResponse.json({ ok: false, error: 'Historical series not available yet' }, { status: 503 });
  }
  return NextResponse.json({
    ok: true,
    country_code: cc,
    series: 'Historical structural index (HSI)',
    license: 'CC BY-NC 4.0 (scores); underlying values: World Bank Open Data, CC BY 4.0',
    attribution: 'The Human Index (thehumanindex.org), using World Bank Open Data',
    methodology: 'https://thehumanindex.org/methodology#historical-series',
    note: 'Not the live composite: built only from indicators with annual World Bank histories; the technological meta-index has no inputs.',
    scores: scoresRes.data,
    ...(withIndicators ? { indicators: valuesRes.data } : {}),
  }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } });
}
