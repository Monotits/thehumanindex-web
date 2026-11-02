/**
 * GET /api/cron/live — Live layer refresh (fast signals).
 *
 * Runs the live adapters (OECD/Eurostat monthly labour + prices, ECB FX,
 * Indeed job postings, GDACS disasters), scores momentum per country, and
 * upserts:
 *   - live_signal_values   (one row per day × country × signal)
 *   - country_live_scores  (one row per day × country, with 7-day smoothing)
 *   - data_source_health   (adapter names prefixed 'live:')
 *
 * Auth: Bearer CRON_SECRET. `?dry=1` computes without writing; allowed
 * without auth outside production so preview deploys can be inspected.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { runLivePipeline, DEFAULT_COUNTRY_CODES, DEFAULT_SIGNAL_WEIGHTS } from '@/lib/live/pipeline';
import { smooth7d } from '@/lib/live/scoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dry = url.searchParams.get('dry') === '1';
  const cronSecret = process.env.CRON_SECRET;
  const authorized = !!cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`;
  const isProd = process.env.VERCEL_ENV === 'production';
  if (!authorized && !(dry && !isProd)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
  if (!sb && !dry) {
    return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 });
  }

  const started = Date.now();
  try {
    // ── Registry (falls back to defaults when the DB is unavailable in dry runs) ──
    let countryCodes = DEFAULT_COUNTRY_CODES;
    let weights: Record<string, number> = DEFAULT_SIGNAL_WEIGHTS;
    if (sb) {
      const [cRes, sRes] = await Promise.all([
        sb.from('countries').select('code').eq('active', true),
        sb.from('live_signals').select('id, weight').eq('active', true),
      ]);
      if (cRes.error) throw new Error(`countries: ${cRes.error.message}`);
      if (cRes.data?.length) countryCodes = cRes.data.map(r => r.code as string);
      if (!sRes.error && sRes.data?.length) {
        weights = Object.fromEntries(sRes.data.map(r => [r.id as string, Number(r.weight)]));
      } else if (sRes.error && !dry) {
        throw new Error(`live_signals: ${sRes.error.message} (run migration 031)`);
      }
    }

    const result = await runLivePipeline({ countryCodes, weights, timeoutMs: 35_000 });
    const today = new Date().toISOString().slice(0, 10);

    if (dry || !sb) {
      return NextResponse.json({
        ok: true, dry: true, date: today, duration_ms: Date.now() - started,
        health: result.health,
        scores: result.scores,
        observations: result.observations,
      });
    }

    // ── Persist signal values ──
    if (result.observations.length) {
      const rows = result.observations.map(o => ({
        snapshot_date: today,
        country_code: o.countryCode,
        signal_id: o.signalId,
        raw_value: o.rawValue,
        stress_score: o.stressScore,
        reference_date: o.referenceDate,
        history_n: o.historyN,
        adapter_id: o.adapterId,
        payload: o.payload ?? null,
      }));
      const { error } = await sb.from('live_signal_values').upsert(rows, { onConflict: 'snapshot_date,country_code,signal_id' });
      if (error) throw new Error(`live_signal_values: ${error.message}`);
    }

    // ── Persist country scores with 7-day smoothing ──
    const scored = result.scores.filter(s => s.liveScore !== null);
    if (scored.length) {
      const since = new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10);
      const { data: prev } = await sb
        .from('country_live_scores')
        .select('country_code, snapshot_date, live_score')
        .gte('snapshot_date', since)
        .lt('snapshot_date', today)
        .order('snapshot_date', { ascending: false });
      const prevBy = new Map<string, number[]>();
      for (const r of prev ?? []) {
        const k = r.country_code as string;
        if (!prevBy.has(k)) prevBy.set(k, []);
        prevBy.get(k)!.push(Number(r.live_score));
      }
      const rows = scored.map(s => ({
        snapshot_date: today,
        country_code: s.countryCode,
        live_score: s.liveScore!,
        live_score_7d: smooth7d(s.liveScore!, prevBy.get(s.countryCode) ?? []),
        signals_count: s.signalsCount,
        contributors: s.contributors,
        computed_at: new Date().toISOString(),
      }));
      const { error } = await sb.from('country_live_scores').upsert(rows, { onConflict: 'snapshot_date,country_code' });
      if (error) throw new Error(`country_live_scores: ${error.message}`);
    }

    // ── Adapter health (shared with /data-sources) ──
    try {
      const nowIso = new Date().toISOString();
      const failed = result.health.filter(h => h.status !== 'ok').map(h => `live:${h.adapter}`);
      const prevOk = new Map<string, string>();
      if (failed.length) {
        const { data } = await sb.from('data_source_health').select('source,last_success_at')
          .in('source', failed).eq('status', 'ok').order('recorded_at', { ascending: false }).limit(20);
        for (const r of data ?? []) if (!prevOk.has(r.source) && r.last_success_at) prevOk.set(r.source, r.last_success_at);
      }
      await sb.from('data_source_health').insert(result.health.map(h => ({
        source: `live:${h.adapter}`,
        status: h.status,
        last_success_at: h.status === 'ok' ? nowIso : (prevOk.get(`live:${h.adapter}`) ?? null),
        last_attempt_at: nowIso,
        last_error: h.error,
        data_points_count: h.observations,
        domains_covered: [] as string[],
        duration_ms: h.durationMs,
      })));
    } catch (e) {
      console.error('[cron-live] health write failed:', e);
    }

    revalidatePath('/');
    revalidatePath('/data-sources');

    return NextResponse.json({
      ok: true,
      date: today,
      duration_ms: Date.now() - started,
      observations: result.observations.length,
      countries_scored: scored.length,
      health: result.health,
    });
  } catch (e) {
    console.error('[cron-live] failed:', e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
