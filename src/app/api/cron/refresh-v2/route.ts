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
import { revalidatePath } from 'next/cache';
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
    const { measurements, allMeasurements, health, unroutedIndicators, divergences } = await fetchAllIndicatorValues(
      indicators,
      countries,
      45_000
    );

    const divergenceWarnings = divergences.filter(d => d.status !== 'ok');
    if (divergenceWarnings.length > 0) {
      console.warn(`[cron-v2] ${divergenceWarnings.length} cross-source divergence warnings`);
    }

    console.log(`[cron-v2] fetched ${measurements.length} measurements across ${health.length} adapters`);
    if (unroutedIndicators.length > 0) {
      console.warn('[cron-v2] indicators without an adapter:', unroutedIndicators);
    }

    // ── Persist per-adapter health to data_source_health ──
    // Shared with the legacy v1 cron's table so /data-sources displays
    // unified status across both pipelines. Adapter names are prefixed with
    // 'v2:' to distinguish from v1 source names.
    try {
      const runStartedAt = new Date().toISOString();
      const failedAdapters = health.filter(h => h.status !== 'ok').map(h => `v2:${h.adapter}`);
      const prevSuccessMap = new Map<string, string>();
      if (failedAdapters.length > 0) {
        const { data: prevHealth } = await sb
          .from('data_source_health')
          .select('source,last_success_at')
          .in('source', failedAdapters)
          .eq('status', 'ok')
          .order('recorded_at', { ascending: false })
          .limit(20);
        for (const row of (prevHealth as { source: string; last_success_at: string }[] | null) || []) {
          if (!prevSuccessMap.has(row.source) && row.last_success_at) {
            prevSuccessMap.set(row.source, row.last_success_at);
          }
        }
      }

      const healthRows = health.map(h => {
        const source = `v2:${h.adapter}`;
        return {
          source,
          status: h.status,
          last_success_at: h.status === 'ok' ? runStartedAt : (prevSuccessMap.get(source) ?? null),
          last_attempt_at: runStartedAt,
          last_error: h.error,
          data_points_count: h.measurementsReturned,
          domains_covered: [] as string[],
          duration_ms: h.durationMs,
        };
      });

      if (healthRows.length > 0) {
        const { error: healthErr } = await sb.from('data_source_health').insert(healthRows);
        if (healthErr) console.error('[cron-v2] data_source_health insert warning:', healthErr.message);
      }
    } catch (e) {
      console.error('[cron-v2] source health write failed:', e);
    }

    // ── Persist cross-source validations (migration 017) ──
    // Append-only event log: one row per (country, indicator) divergence
    // computation per run. Powers the streak view and transparency API.
    if (divergences.length > 0) {
      const csvRows = divergences.map(d => ({
        country_code: d.countryCode,
        indicator_id: d.indicatorId,
        observations: d.observations.map(o => ({
          adapter_id: o.adapterId,
          raw_value: o.rawValue,
          reference_date: o.referenceDate,
        })),
        divergence_pct: d.divergencePercent,
        status: d.status,
        threshold_pct: d.thresholdPercent,
        metadata: {
          run_id: new Date().toISOString(),
          observation_count: d.observations.length,
        },
      }));
      const CHUNK_CSV = 200;
      for (let i = 0; i < csvRows.length; i += CHUNK_CSV) {
        const slice = csvRows.slice(i, i + CHUNK_CSV);
        const { error: csvErr } = await sb.from('cross_source_validations').insert(slice);
        if (csvErr) {
          // Soft-fail: keep cron running even if this table isn't migrated yet.
          console.warn('[cron-v2] cross_source_validations write skipped:', csvErr.message);
          break;
        }
      }
    }

    // ── Persist indicator_values (append-only audit log) ──
    // We store ALL measurements (primary + secondary cross-source values) so
    // the audit log captures every adapter's view. Payload carries the
    // adapter id so v_country_latest_indicators (DISTINCT ON country+indicator)
    // can later prefer primary by ordering, or we add a primary flag if needed.
    const persistRows = allMeasurements.map(m => ({
      country_code: m.countryCode,
      indicator_id: m.indicatorId,
      raw_value: m.rawValue,
      normalized_value: m.normalizedValue,
      reference_date: m.referenceDate,
      payload: { ...(m.payload ?? {}), adapter_id: m.adapterId },
    }));
    if (persistRows.length > 0) {
      const CHUNK = 500;
      for (let i = 0; i < persistRows.length; i += CHUNK) {
        const { error: ivErr } = await sb.from('indicator_values').insert(persistRows.slice(i, i + CHUNK));
        if (ivErr) console.error('[cron-v2] indicator_values insert warning:', ivErr.message);
      }
    }

    // ── Upsert daily indicator snapshots (migration 018) ──
    // One row per (country, indicator, day) with the primary measurement.
    // Idempotent across multiple runs same day — unique constraint
    // (snapshot_date, country_code, indicator_id) → upsert on conflict.
    if (measurements.length > 0) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      // Count adapter coverage per pair to fill source_count
      const adapterCountByPair = new Map<string, number>();
      for (const am of allMeasurements) {
        const k = `${am.countryCode}|${am.indicatorId}`;
        adapterCountByPair.set(k, (adapterCountByPair.get(k) ?? 0) + 1);
      }

      const snapRows = measurements.map(m => ({
        snapshot_date: today,
        country_code: m.countryCode,
        indicator_id: m.indicatorId,
        raw_value: m.rawValue,
        normalized_value: m.normalizedValue,
        primary_adapter: m.adapterId,
        source_count: adapterCountByPair.get(`${m.countryCode}|${m.indicatorId}`) ?? 1,
        reference_date: m.referenceDate.split('T')[0],
        recorded_at: new Date().toISOString(),
      }));

      const CHUNK_SNAP = 500;
      for (let i = 0; i < snapRows.length; i += CHUNK_SNAP) {
        const { error: snapErr } = await sb
          .from('indicator_snapshots')
          .upsert(snapRows.slice(i, i + CHUNK_SNAP), {
            onConflict: 'snapshot_date,country_code,indicator_id',
          });
        if (snapErr) {
          console.warn('[cron-v2] indicator_snapshots upsert skipped:', snapErr.message);
          break;
        }
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

      const countryDivergences = divergences.filter(d => d.countryCode === c.countryCode);
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
            divergences: countryDivergences.length > 0 ? countryDivergences : undefined,
            divergence_warnings: countryDivergences.filter(d => d.status !== 'ok').length,
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

    // Total-failure guard: v1'deki gibi, hiçbir ölçüm/composite üretilemediyse
    // 200 dönmek yerine 502 dön ki Vercel cron log'unda kırmızı görünsün ve
    // sayfalar sessizce dünkü veride donmasın.
    if (measurements.length === 0 || persistedComposites === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Pipeline produced zero measurements/composites',
        measurements_collected: measurements.length,
        composites_persisted: persistedComposites,
        adapters_health: health,
        duration_ms: duration,
      }, { status: 502 });
    }

    // v2 tablolarından beslenen ISR sayfalarını tazele — önceden hiçbiri
    // revalidate edilmediğinden yeni composite'lar 30-60 dk gecikmeli görünüyordu.
    try {
      revalidatePath('/');
      revalidatePath('/countries');
      revalidatePath('/indicators');
      revalidatePath('/top-10');
      revalidatePath('/transparency');
    } catch (e) {
      console.warn('[cron-v2] revalidatePath warning:', e);
    }

    return NextResponse.json({
      ok: true,
      countries_tracked: countries.length,
      indicators_active: indicators.length,
      measurements_collected: measurements.length,
      measurements_all_sources: allMeasurements.length,
      composites_persisted: persistedComposites,
      adapters_health: health,
      unrouted_indicators: unroutedIndicators,
      divergences_total: divergences.length,
      divergence_warnings: divergenceWarnings.length,
      divergence_critical: divergences.filter(d => d.status === 'critical').length,
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
