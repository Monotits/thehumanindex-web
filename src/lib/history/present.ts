import type { SupabaseClient } from '@supabase/supabase-js';

export interface HistoricalPoint {
  year: number;
  composite: number | null;
  meta: Record<string, { value: number | null; with_data: number; total: number }>;
  indicators_used: number;
  indicators_total: number;
}

/** Fail-soft reader: empty array before migration 032 / first backfill. */
export async function loadHistorical(sb: SupabaseClient, code: string): Promise<HistoricalPoint[]> {
  try {
    const { data, error } = await sb
      .from('historical_scores')
      .select('year, composite, meta, indicators_used, indicators_total')
      .eq('country_code', code.toUpperCase())
      .order('year', { ascending: true });
    if (error || !data) return [];
    return (data as HistoricalPoint[]).map(r => ({ ...r, composite: r.composite === null ? null : Number(r.composite) }));
  } catch {
    return [];
  }
}

/** Largest single-year rise in the series — the "story" the chart should point at. */
export function biggestJump(points: HistoricalPoint[]): { from: number; to: number; delta: number } | null {
  let best: { from: number; to: number; delta: number } | null = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].composite, b = points[i].composite;
    if (a === null || b === null) continue;
    const d = b - a;
    if (!best || d > best.delta) best = { from: points[i - 1].year, to: points[i].year, delta: Math.round(d * 10) / 10 };
  }
  return best && best.delta > 0 ? best : null;
}
