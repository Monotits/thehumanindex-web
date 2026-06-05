/**
 * GET /api/trends/[country]/[indicator] — historical time series
 *
 * Returns up to 90 days of daily snapshots for one (country, indicator)
 * pair, plus convenience summaries for the dashboard:
 *   - latest, 30-day-ago, 90-day-ago points
 *   - absolute and percent change in raw and normalized stress score
 *   - sparkline-ready array of {date, raw, normalized} points
 *
 * Powered by the `indicator_snapshots` table (migration 018). 5-minute
 * edge cache; cron writes new snapshots once a day per pair.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

interface SnapshotRow {
  snapshot_date: string;       // YYYY-MM-DD
  raw_value: number;
  normalized_value: number | null;
  primary_adapter: string | null;
  source_count: number | null;
  reference_date: string | null;
}

interface IndicatorMetaRow {
  id: string;
  name: string;
  meta_index: string;
  unit: string | null;
  source_org: string | null;
  source_url: string | null;
  normalize_invert: boolean;
}

function pickClosest(
  rows: SnapshotRow[],
  targetDaysAgo: number,
  toleranceDays: number
): SnapshotRow | null {
  const targetMs = Date.now() - targetDaysAgo * 86400 * 1000;
  const minMs = targetMs - toleranceDays * 86400 * 1000;
  const maxMs = targetMs + toleranceDays * 86400 * 1000;
  let best: SnapshotRow | null = null;
  let bestDist = Infinity;
  for (const r of rows) {
    const t = new Date(r.snapshot_date).getTime();
    if (t < minMs || t > maxMs) continue;
    const dist = Math.abs(t - targetMs);
    if (dist < bestDist) {
      bestDist = dist;
      best = r;
    }
  }
  return best;
}

function pctChange(curr: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string; indicator: string }> }
) {
  const { country: rawCountry, indicator } = await params;
  const countryCode = rawCountry.toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid country code' },
      { status: 400 }
    );
  }
  if (!/^[a-z0-9_]+$/i.test(indicator)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid indicator id' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  const sb = createClient(supabaseUrl, anonKey);

  const since = new Date(Date.now() - 95 * 86400 * 1000).toISOString().split('T')[0];

  const [snapsRes, indMetaRes] = await Promise.all([
    sb
      .from('indicator_snapshots')
      .select('snapshot_date,raw_value,normalized_value,primary_adapter,source_count,reference_date')
      .eq('country_code', countryCode)
      .eq('indicator_id', indicator)
      .gte('snapshot_date', since)
      .order('snapshot_date', { ascending: true }),
    sb
      .from('indicators')
      .select('id,name,meta_index,unit,source_org,source_url,normalize_invert')
      .eq('id', indicator)
      .single(),
  ]);

  if (indMetaRes.error || !indMetaRes.data) {
    return NextResponse.json(
      { ok: false, error: `Indicator ${indicator} not found` },
      { status: 404 }
    );
  }

  const snaps = (snapsRes.data ?? []) as SnapshotRow[];
  const indMeta = indMetaRes.data as IndicatorMetaRow;

  if (snaps.length === 0) {
    return NextResponse.json({
      ok: true,
      country_code: countryCode,
      indicator: indMeta,
      series: [],
      summary: {
        days_of_history: 0,
        message: 'No snapshots yet — first one writes on next cron run.',
      },
    });
  }

  const series = snaps.map(s => ({
    date: s.snapshot_date,
    raw: Number(s.raw_value),
    normalized: s.normalized_value === null ? null : Number(s.normalized_value),
    adapter: s.primary_adapter,
    sources: s.source_count,
  }));

  const latest = snaps[snaps.length - 1];
  const monthAgo = pickClosest(snaps, 30, 5);
  const ninetyAgo = pickClosest(snaps, 90, 7);

  const summary = {
    days_of_history: snaps.length,
    latest: {
      date: latest.snapshot_date,
      raw: Number(latest.raw_value),
      normalized: latest.normalized_value === null ? null : Number(latest.normalized_value),
    },
    month_ago: monthAgo && {
      date: monthAgo.snapshot_date,
      raw: Number(monthAgo.raw_value),
      normalized: monthAgo.normalized_value === null ? null : Number(monthAgo.normalized_value),
    },
    ninety_days_ago: ninetyAgo && {
      date: ninetyAgo.snapshot_date,
      raw: Number(ninetyAgo.raw_value),
      normalized: ninetyAgo.normalized_value === null ? null : Number(ninetyAgo.normalized_value),
    },
    change_30d: monthAgo
      ? {
          delta_raw: Math.round((Number(latest.raw_value) - Number(monthAgo.raw_value)) * 100) / 100,
          pct_raw: pctChange(Number(latest.raw_value), Number(monthAgo.raw_value)),
          delta_normalized:
            latest.normalized_value !== null && monthAgo.normalized_value !== null
              ? Math.round((Number(latest.normalized_value) - Number(monthAgo.normalized_value)) * 100) / 100
              : null,
          pct_normalized:
            latest.normalized_value !== null
              ? pctChange(Number(latest.normalized_value), monthAgo.normalized_value === null ? null : Number(monthAgo.normalized_value))
              : null,
        }
      : null,
    change_90d: ninetyAgo
      ? {
          delta_raw: Math.round((Number(latest.raw_value) - Number(ninetyAgo.raw_value)) * 100) / 100,
          pct_raw: pctChange(Number(latest.raw_value), Number(ninetyAgo.raw_value)),
        }
      : null,
  };

  return NextResponse.json(
    {
      ok: true,
      country_code: countryCode,
      indicator: indMeta,
      series,
      summary,
    },
    {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    }
  );
}
