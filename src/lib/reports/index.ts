/**
 * Monthly numbered reports — "State of Human Stress". Each report is FROZEN
 * at its publication timestamp: every query reads data as of `publishedAt`,
 * so later data changes never alter a published edition.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LiveContributor } from '@/lib/live/present';

export interface ReportMeta {
  period: string;       // 'YYYY-MM'
  number: number;
  publishedAt: string;  // ISO timestamp the data is frozen at
  methodVersion: string; // composite methodology version in force at publishedAt
}

/** Newest first. Add one entry per month. */
export const REPORTS: ReportMeta[] = [
  { period: '2026-11', number: 1, publishedAt: '2026-11-02T16:00:00Z', methodVersion: '2.1' },
];

export function reportTitle(r: ReportMeta): string {
  const m = new Date(r.period + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `State of Human Stress — ${m}`;
}

export interface ReportRow {
  code: string;
  name: string;
  flag: string | null;
  composite: number;
  band: string;
  live: number | null;
  liveContributors: LiveContributor[];
}

export async function loadReportData(sb: SupabaseClient, r: ReportMeta): Promise<ReportRow[]> {
  const until = r.publishedAt;
  const from = new Date(new Date(until).getTime() - 4 * 86_400_000).toISOString();
  const liveDay = until.slice(0, 10);
  const [cRes, compRes, liveRes] = await Promise.all([
    sb.from('countries').select('code, name, flag_emoji').eq('active', true),
    sb.from('country_composite_scores').select('country_code, score_value, band, computed_at')
      .lte('computed_at', until).gte('computed_at', from).order('computed_at', { ascending: false }).limit(500),
    sb.from('country_live_scores').select('country_code, live_score, live_score_7d, contributors, snapshot_date')
      .lte('snapshot_date', liveDay).order('snapshot_date', { ascending: false }).limit(200),
  ]);
  const comp = new Map<string, { score_value: number; band: string }>();
  for (const row of compRes.data ?? []) if (!comp.has(row.country_code)) comp.set(row.country_code, row);
  const live = new Map<string, { live_score: number; live_score_7d: number | null; contributors: LiveContributor[] }>();
  for (const row of liveRes.data ?? []) if (!live.has(row.country_code)) live.set(row.country_code, row);
  return (cRes.data ?? [])
    .filter(c => comp.has(c.code))
    .map(c => {
      const k = comp.get(c.code)!, l = live.get(c.code);
      return {
        code: c.code, name: c.name, flag: c.flag_emoji,
        composite: Number(k.score_value), band: k.band,
        live: l ? Number(l.live_score_7d ?? l.live_score) : null,
        liveContributors: l?.contributors ?? [],
      };
    })
    .sort((a, b) => b.composite - a.composite);
}
