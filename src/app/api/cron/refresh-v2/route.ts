/**
 * GET /api/cron/refresh-v2 — Meta-index + multi-country refresh
 *
 * This is the new architecture pipeline (migration 007 schema). It runs in
 * parallel with the legacy /api/cron/refresh until the meta-index version
 * proves out and the dashboard reads from it primarily.
 *
 * Flow:
 *   1. Load active countries and active indicators from registry
 *   2. Orchestrator routes indicators to adapters and fetches raw values
 *   3. Normalize each raw value into 0-100 using indicator bounds
 *   4. Compose per-meta-index and composite scores per country
 *   5. Persist:
 *        - indicator_values (append-only audit log)
 *        - country_composite_scores (one row per country per run)
 *        - meta_index_scores (5 rows per composite)
 *
 * Protected by CRON_SECRET like the legacy cron.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllIndicatorValues } from '@/lib/indicators/orchestrator';
import { composeCountryScores } from '@/lib/indicators/composeMetaIndex';
import type { IndicatorRegistryRow, CountryRow } from '@/lib/indicators/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceRoleKey);
  const startTime = Date.now();

  try {
    // ── Load registry ──
    const [countriesRes, indicatorsRes] = await Promise.all([
      sb.from('countries').select('*').eq('active', true),
      sb.from('indicators').select('*').eq('active', true).order('display_order'),
    ]);

    if (countriesRes.error) throw new Error(`countries: ${countriesRes.error.message}`);
    if (indicatorsRes.error) throw new Error(`indicators: ${indicatorsRes.error.message}`);

    const countries = (countriesRes.data ?? []) as CountryRow[];
    const indicators = (indicatorsRes.data ?? []) as IndicatorRegistryRow[];

    if (countries.length === 0 || indicators.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Empty registry — run migration 007 to seed countries + indicators',
      }, { status: 500 });
    }

    // ── Fetch + normalize ──
    // Per-adapter timeout. Vercel function maxDuration is 60s, so 45s leaves a
    // 15s safety margin for downstream persistence.
    const { measurements, health, unroutedIndicators } = await fetchAllIndicatorValues(
      indicators,
      countries,
      45_000
    );

    console.log(`[cron-v2] fetched ${measurements.length} measurements across ${health.length} adapters`);
    if (unroutedIndicators.length > 0) {
      console.warn('[cron-v2] indicators without an adapter:', unroutedIndicators);
    }

    // ── Persist indicator_values (append-only audit log) ──
    if (measurements.length > 0) {
      const rows = measurements.map(m => ({
        country_code: m.countryCode,
        indicator_id: m.indicatorId,
        raw_value: m.rawValue,
        normalized_value: m.normalizedValue,
        reference_date: m.referenceDate,
        payload: m.payload ?? null,
      }));
      // Chunked insert to keep payload size reasonable
      const CHUNK = 500;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error: ivErr } = await sb.from('indicator_values').insert(rows.slice(i, i + CHUNK));
        if (ivErr) console.error('[cron-v2] indicator_values insert warning:', ivErr.message);
      }
    }

    // ── Compose per-country scores ──
    const compositions = composeCountryScores(
      measurements,
      indicators,
      countries.map(c => c.code)
    );

    // ── Compute deltas vs previous composite per country ──
    const prevCompositesRes = await sb
      .from('v_country_latest_composite')
      .select('country_code, score_value');
    const prevByCountry = new Map<string, number>();
    for (const r of (prevCompositesRes.data ?? []) as { country_code: string; score_value: number }[]) {
      prevByCountry.set(r.country_code, r.score_value);
    }

    // ── Persist composites + meta-index scores ──
    let persistedComposites = 0;
    const compositeSummary: Array<{ country: string; composite: number | null; band: string | null; meta_with_data: number; confidence: number }> = [];

    for (const c of compositions) {
      if (c.compositeValue === null || c.band === null) continue;
      const prev = prevByCountry.get(c.countryCode);
      const delta = prev !== undefined ? Math.round((c.compositeValue - prev) * 100) / 100 : null;

      const { data: insertedComposite, error: compErr } = await sb
        .from('country_composite_scores')
        .insert({
          country_code: c.countryCode,
          score_value: c.compositeValue,
          band: c.band,
          delta,
          meta_indexes_with_data: c.metaIndexesWithData,
          meta_indexes_total: c.metaIndexesTotal,
          confidence: c.confidence,
          computed_at: new Date().toISOString(),
          metadata: {
            cron_v2: true,
            adapters_health: health,
            unrouted_indicators: unroutedIndicators,
          },
        })
        .select('id')
        .single();

      if (compErr) {
        console.error(`[cron-v2] composite insert error for ${c.countryCode}:`, compErr.message);
        continue;
      }
      persistedComposites++;

      // Meta-index rows for this composite
      const metaRows = c.metaIndexes.map(m => ({
        country_composite_score_id: insertedComposite.id,
        meta_index: m.metaIndex,
        value: m.value,
        weight: m.weight,
        indicators_count: m.indicatorsCount,
        indicators_with_data: m.indicatorsWithData,
        raw_data: m.rawData,
      }));
      const { error: metaErr } = await sb.from('meta_index_scores').insert(metaRows);
      if (metaErr) console.error(`[cron-v2] meta_index_scores insert error for ${c.countryCode}:`, metaErr.message);

      compositeSummary.push({
        country: c.countryCode,
        composite: c.compositeValue,
        band: c.band,
        meta_with_data: c.metaIndexesWithData,
        confidence: c.confidence,
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[cron-v2] ✓ done in ${duration}ms — ${persistedComposites}/${countries.length} composites persisted`);

    return NextResponse.json({
      ok: true,
      countries_tracked: countries.length,
      indicators_active: indicators.length,
      measurements_collected: measurements.length,
      composites_persisted: persistedComposites,
      adapters_health: health,
      unrouted_indicators: unroutedIndicators,
      summary: compositeSummary,
      duration_ms: duration,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - startTime,
    }, { status: 500 });
  }
}
