/**
 * Composite + meta-index history loaders for sparkline rendering.
 *
 * `country_composite_scores` is written once per cron run (every 12h) for
 * every active country. To produce a sparkline series we bucket those
 * rows by day and take the latest value of the day. Returns an array of
 * (potentially-null) numbers ready to hand to <SparklineMini />.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_DAYS = 90;

export interface CompositeHistoryPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

/**
 * Composite history per country, last N days (default 90). Bucketed by
 * day; for days with multiple cron runs the latest within the day wins.
 *
 * Returns a Map: country_code → ordered chronological points.
 */
export async function loadCompositeHistory(
  countryCodes: string[],
  days = DEFAULT_DAYS,
): Promise<Map<string, CompositeHistoryPoint[]>> {
  const out = new Map<string, CompositeHistoryPoint[]>();
  if (countryCodes.length === 0) return out;

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return out;

  const sb: SupabaseClient = createClient(sbUrl, sbKey);
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

  const res = await sb
    .from('country_composite_scores')
    .select('country_code, score_value, computed_at')
    .in('country_code', countryCodes)
    .gte('computed_at', since)
    .order('computed_at', { ascending: true })
    .limit(5000);

  if (!res.data) return out;

  // Bucket per (country, YYYY-MM-DD): latest value wins
  const byCountryDate = new Map<string, Map<string, number>>();
  for (const row of res.data as Array<{
    country_code: string;
    score_value: number;
    computed_at: string;
  }>) {
    const date = row.computed_at.slice(0, 10);
    if (!byCountryDate.has(row.country_code)) {
      byCountryDate.set(row.country_code, new Map());
    }
    // Later iteration overwrites earlier — input is asc by computed_at,
    // so we end up with the latest value per day.
    byCountryDate.get(row.country_code)!.set(date, row.score_value);
  }

  byCountryDate.forEach((dateMap, cc) => {
    const points: CompositeHistoryPoint[] = [];
    Array.from(dateMap.keys())
      .sort()
      .forEach((date) => {
        points.push({ date, value: dateMap.get(date)! });
      });
    out.set(cc, points);
  });

  return out;
}

/**
 * Convert a list of CompositeHistoryPoint into the dense {n}-length
 * value array <SparklineMini /> expects. Missing days become null so
 * the line shows a gap.
 *
 * Useful when you want all countries' sparklines aligned visually (same
 * x-range / same point count).
 */
export function pointsToDenseSeries(
  points: CompositeHistoryPoint[],
  days: number = DEFAULT_DAYS,
): Array<number | null> {
  const out: Array<number | null> = Array(days).fill(null);
  if (points.length === 0) return out;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startMs = today.getTime() - (days - 1) * 86400 * 1000;

  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.value);

  for (let i = 0; i < days; i++) {
    const d = new Date(startMs + i * 86400 * 1000);
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key);
    if (v !== undefined) out[i] = v;
  }
  return out;
}

/**
 * Trend direction (up / flat / down) and delta over the series window.
 * Useful for inline arrow indicators next to a sparkline.
 */
export function trendSummary(series: Array<number | null>) {
  const cleaned = series.filter((v): v is number => v !== null && Number.isFinite(v));
  if (cleaned.length < 2) {
    return { direction: 'flat' as const, delta: 0, deltaPct: 0 };
  }
  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / first) * 100 : 0;
  let direction: 'up' | 'flat' | 'down' = 'flat';
  if (Math.abs(delta) >= 0.5) direction = delta > 0 ? 'up' : 'down';
  return { direction, delta, deltaPct };
}
