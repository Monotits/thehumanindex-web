/**
 * GET /api/cron/history — rebuild the historical structural index (HSI).
 * World Bank annual series 2000 → last full year, all active countries.
 * Monthly cron; idempotent upserts. Auth: Bearer CRON_SECRET.
 * `?dry=1` returns a summary without writing (allowed outside production).
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { IndicatorRegistryRow } from '@/lib/indicators/types';
import { composeHistory, fetchWorldBankHistory, historicalIndicators, HSI_METHOD_VERSION, HSI_START_YEAR } from '@/lib/history/annual';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dry = url.searchParams.get('dry') === '1';
  const cronSecret = process.env.CRON_SECRET;
  const authorized = !!cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`;
  if (!authorized && !(dry && process.env.VERCEL_ENV !== 'production')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 });
  const sb = createClient(supabaseUrl, key);
  const started = Date.now();

  try {
    const [cRes, iRes] = await Promise.all([
      sb.from('countries').select('code').eq('active', true),
      sb.from('indicators').select('*').eq('active', true),
    ]);
    if (cRes.error) throw new Error(`countries: ${cRes.error.message}`);
    if (iRes.error) throw new Error(`indicators: ${iRes.error.message}`);
    const countryCodes = (cRes.data ?? []).map(r => r.code as string);
    const registry = (iRes.data ?? []) as IndicatorRegistryRow[];
    const indicators = historicalIndicators(registry);
    const endYear = new Date().getUTCFullYear() - 1;

    const { observations, errors } = await fetchWorldBankHistory(indicators, countryCodes, HSI_START_YEAR - 5, endYear);
    // Composition uses the FULL registry so meta "total" counts stay honest,
    // but only historical indicators can contribute values.
    const scores = composeHistory(observations, registry, countryCodes, HSI_START_YEAR, endYear);

    if (dry) {
      return NextResponse.json({
        ok: true, dry: true, duration_ms: Date.now() - started,
        indicators: indicators.map(i => i.id), observations: observations.length, errors,
        sample: scores.filter(s => s.countryCode === 'TR').map(s => ({ year: s.year, composite: s.composite, used: s.indicatorsUsed })),
      });
    }

    const valueRows = observations.map(o => ({
      country_code: o.countryCode, indicator_id: o.indicatorId, year: o.year,
      raw_value: o.rawValue, normalized_value: o.normalizedValue, source: 'worldBank', fetched_at: new Date().toISOString(),
    }));
    for (let i = 0; i < valueRows.length; i += 1000) {
      const { error } = await sb.from('historical_indicator_values').upsert(valueRows.slice(i, i + 1000), { onConflict: 'country_code,indicator_id,year' });
      if (error) throw new Error(`historical_indicator_values: ${error.message} (run migration 032)`);
    }
    const scoreRows = scores.map(s => ({
      country_code: s.countryCode, year: s.year, composite: s.composite, meta: s.meta,
      indicators_used: s.indicatorsUsed, indicators_total: s.indicatorsTotal,
      method_version: HSI_METHOD_VERSION, computed_at: new Date().toISOString(),
    }));
    for (let i = 0; i < scoreRows.length; i += 1000) {
      const { error } = await sb.from('historical_scores').upsert(scoreRows.slice(i, i + 1000), { onConflict: 'country_code,year' });
      if (error) throw new Error(`historical_scores: ${error.message}`);
    }

    revalidatePath('/country/[code]', 'page');
    return NextResponse.json({
      ok: true, duration_ms: Date.now() - started, years: `${HSI_START_YEAR}-${endYear}`,
      indicators: indicators.length, observations: observations.length, scores: scoreRows.length,
      errors: errors.slice(0, 10), error_count: errors.length,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
