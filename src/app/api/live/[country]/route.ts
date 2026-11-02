/**
 * GET /api/live/{iso2} — Live layer for one country: latest signal values
 * plus up to 180 days of daily Live scores. CC BY-NC 4.0 like /api/data.
 */

import { NextResponse } from 'next/server';
import { anonClient } from '@/lib/live/present';

export const revalidate = 1800;

export async function GET(_req: Request, { params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const cc = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) {
    return NextResponse.json({ ok: false, error: 'Invalid country code' }, { status: 400 });
  }
  const sb = await anonClient();
  if (!sb) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });

  const since = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);
  const [signalsRes, historyRes, valuesRes] = await Promise.all([
    sb.from('live_signals').select('id, meta_index, name, description, source_org, source_url, frequency, weight').eq('active', true).order('display_order'),
    sb.from('country_live_scores').select('snapshot_date, live_score, live_score_7d, signals_count')
      .eq('country_code', cc).gte('snapshot_date', since).order('snapshot_date', { ascending: true }),
    sb.from('live_signal_values').select('snapshot_date, signal_id, raw_value, stress_score, reference_date, history_n, adapter_id, payload')
      .eq('country_code', cc).order('snapshot_date', { ascending: false }).limit(20),
  ]);
  if (signalsRes.error || historyRes.error || valuesRes.error) {
    return NextResponse.json({ ok: false, error: 'Live layer not available yet' }, { status: 503 });
  }

  // Latest row per signal
  const latest = new Map<string, unknown>();
  for (const v of valuesRes.data ?? []) if (!latest.has(v.signal_id)) latest.set(v.signal_id, v);

  return NextResponse.json({
    ok: true,
    country_code: cc,
    license: 'CC BY-NC 4.0',
    attribution: 'The Human Index (thehumanindex.org)',
    methodology: 'https://thehumanindex.org/methodology#live-layer',
    scale: '0-100; 50 = a normal period for this country; higher = deteriorating faster than usual',
    signals: signalsRes.data,
    latest: Array.from(latest.values()),
    history: historyRes.data,
  }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } });
}
