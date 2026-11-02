/**
 * GET /api/export?dataset=<name>[&country=<iso2>] → CSV download.
 *
 * Datasets:
 *   scores      latest composite + meta-indexes + Live score (our derived data, CC BY-NC 4.0)
 *   historical  annual historical structural index 2000→ (derived, CC BY-NC 4.0)
 *   worldbank   underlying World Bank annual values (World Bank Open Data, CC BY 4.0)
 *
 * Raw values from proprietary reference sources (Gallup, Edelman,
 * DataReportal, McKinsey, IHME, WVS, OECD Better Life…) are deliberately NOT
 * exported in bulk — only our normalised/derived scores and openly licensed
 * series are.
 */

import { anonClient } from '@/lib/live/present';
import { toCsv } from '@/lib/export/csv';

export const revalidate = 3600;

const META = ['economic', 'social', 'mental', 'technological', 'environmental'] as const;

function csvResponse(name: string, body: string, license: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-License': license,
      Link: '<https://thehumanindex.org/methodology>; rel="describedby"',
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dataset = url.searchParams.get('dataset') ?? 'scores';
  const country = url.searchParams.get('country')?.toUpperCase() ?? null;
  if (country && !/^[A-Z]{2}$/.test(country)) return new Response('Invalid country code', { status: 400 });
  const sb = await anonClient();
  if (!sb) return new Response('Server misconfigured', { status: 500 });
  const today = new Date().toISOString().slice(0, 10);
  const suffix = country ? `-${country.toLowerCase()}` : '';

  if (dataset === 'scores') {
    let cq = sb.from('countries').select('code, name, region').eq('active', true).order('name');
    if (country) cq = cq.eq('code', country);
    const [cRes, compRes, metaRes, liveRes] = await Promise.all([
      cq,
      sb.from('v_country_latest_composite').select('country_code, score_value, band, confidence, computed_at'),
      sb.from('v_country_latest_meta_indexes').select('country_code, meta_index, value'),
      sb.from('v_country_latest_live').select('country_code, live_score, live_score_7d, signals_count, snapshot_date'),
    ]);
    if (cRes.error || compRes.error || metaRes.error) return new Response('Data unavailable', { status: 503 });
    const comp = new Map((compRes.data ?? []).map(r => [r.country_code, r]));
    const live = new Map((liveRes.data ?? []).map(r => [r.country_code, r]));
    const meta = new Map<string, Record<string, number | null>>();
    for (const m of metaRes.data ?? []) {
      const e = meta.get(m.country_code) ?? {};
      e[m.meta_index] = m.value === null ? null : Number(m.value);
      meta.set(m.country_code, e);
    }
    const rows = (cRes.data ?? []).map(c => {
      const k = comp.get(c.code), l = live.get(c.code), m = meta.get(c.code) ?? {};
      return [c.code, c.name, c.region, k?.score_value ?? null, k?.band ?? null, ...META.map(x => m[x] ?? null),
        k?.confidence ?? null, k?.computed_at?.slice(0, 10) ?? null,
        l?.live_score ?? null, l?.live_score_7d ?? null, l?.signals_count ?? null, l?.snapshot_date ?? null];
    });
    return csvResponse(`thi-scores${suffix}-${today}.csv`, toCsv(
      ['iso2', 'country', 'region', 'composite', 'band', ...META, 'data_coverage', 'composite_date',
        'live_score', 'live_score_7d', 'live_signals', 'live_date'], rows), 'CC BY-NC 4.0');
  }

  if (dataset === 'historical') {
    let q = sb.from('historical_scores').select('country_code, year, composite, meta, indicators_used, indicators_total, method_version')
      .order('country_code').order('year');
    if (country) q = q.eq('country_code', country);
    const { data, error } = await q;
    if (error) return new Response('Data unavailable', { status: 503 });
    const rows = (data ?? []).map(r => [r.country_code, r.year, r.composite,
      ...['economic', 'social', 'mental', 'environmental'].map(m => (r.meta as Record<string, { value: number | null }>)[m]?.value ?? null),
      r.indicators_used, r.indicators_total, r.method_version]);
    return csvResponse(`thi-historical-annual${suffix}-${today}.csv`, toCsv(
      ['iso2', 'year', 'historical_index', 'economic', 'social', 'mental', 'environmental', 'indicators_used', 'indicators_total', 'method_version'], rows), 'CC BY-NC 4.0');
  }

  if (dataset === 'worldbank') {
    // Supabase caps a page at 1000 rows — page through.
    const all: { country_code: string; indicator_id: string; year: number; raw_value: number; normalized_value: number | null }[] = [];
    for (let from = 0; from < 50_000; from += 1000) {
      let q = sb.from('historical_indicator_values').select('country_code, indicator_id, year, raw_value, normalized_value')
        .gte('year', 2000).order('country_code').order('indicator_id').order('year').range(from, from + 999);
      if (country) q = q.eq('country_code', country);
      const { data, error } = await q;
      if (error) return new Response('Data unavailable', { status: 503 });
      all.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return csvResponse(`thi-worldbank-annual${suffix}-${today}.csv`, toCsv(
      ['iso2', 'indicator_id', 'year', 'raw_value', 'stress_score_0_100'],
      all.map(r => [r.country_code, r.indicator_id, r.year, r.raw_value, r.normalized_value])), 'World Bank Open Data, CC BY 4.0');
  }

  return new Response('Unknown dataset. Use scores | historical | worldbank.', { status: 400 });
}
