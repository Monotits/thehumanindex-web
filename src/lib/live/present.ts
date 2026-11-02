/**
 * Live layer — read + presentation helpers shared by server pages.
 * Every reader is fail-soft: before migration 031 is applied (or if the
 * cron has never run) callers get an empty map and render nothing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface LiveContributor {
  signal_id: string;
  stress_score: number;
  weight: number;
  raw_value: number;
  reference_date: string;
}

export interface LiveCountry {
  country_code: string;
  snapshot_date: string;
  live_score: number;
  live_score_7d: number | null;
  signals_count: number;
  contributors: LiveContributor[];
  computed_at: string;
}

export async function loadLatestLive(sb: SupabaseClient): Promise<Map<string, LiveCountry>> {
  try {
    const { data, error } = await sb
      .from('v_country_latest_live')
      .select('country_code, snapshot_date, live_score, live_score_7d, signals_count, contributors, computed_at');
    if (error || !data) return new Map();
    // A country whose latest Live row is older than 10 days is not "live" any more.
    const cutoff = Date.now() - 10 * 86_400_000;
    return new Map(
      (data as LiveCountry[])
        .filter(r => new Date(r.snapshot_date).getTime() >= cutoff)
        .map(r => [r.country_code, { ...r, live_score: Number(r.live_score), live_score_7d: r.live_score_7d === null ? null : Number(r.live_score_7d) }]),
    );
  } catch {
    return new Map();
  }
}

export const SIGNAL_LABELS: Record<string, { name: string; source: string; unit: 'pp' | 'pct' | 'alert' }> = {
  unemployment_momentum: { name: 'Unemployment', source: 'OECD / Eurostat', unit: 'pp' },
  inflation_momentum:    { name: 'Inflation',    source: 'Eurostat HICP / OECD', unit: 'pp' },
  fx_pressure:           { name: 'Currency',     source: 'ECB reference rates', unit: 'pct' },
  job_postings_momentum: { name: 'Job postings', source: 'Indeed Hiring Lab', unit: 'pct' },
  active_disasters:      { name: 'Disasters',    source: 'GDACS', unit: 'alert' },
};

export type LiveTone = 'easing' | 'normal' | 'rising' | 'high';

export function liveTone(score: number | null | undefined): LiveTone | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  if (score < 40) return 'easing';
  if (score <= 60) return 'normal';
  if (score <= 75) return 'rising';
  return 'high';
}

export const LIVE_TONE_LABEL: Record<LiveTone, string> = {
  easing: 'Easing',
  normal: 'Normal',
  rising: 'Rising',
  high: 'High pressure',
};

export const LIVE_TONE_TEXT_CLASS: Record<LiveTone, string> = {
  easing: 'band-text-low',
  normal: 'text-foreground-muted',
  rising: 'band-text-elevated',
  high: 'band-text-high',
};

const signed = (x: number, d = 1) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${Math.abs(x).toFixed(d)}`;

/** One plain-language line per contributor, e.g. "Unemployment +0.7 pp in 6 months". */
export function describeContributor(c: LiveContributor): string {
  const label = SIGNAL_LABELS[c.signal_id]?.name ?? c.signal_id;
  switch (c.signal_id) {
    case 'unemployment_momentum':
      return `${label} ${signed(c.raw_value)} pp in 6 months`;
    case 'inflation_momentum':
      return `${label} ${signed(c.raw_value)} pp in 6 months`;
    case 'fx_pressure':
      return c.raw_value >= 0
        ? `Currency ${Math.abs(c.raw_value).toFixed(1)}% weaker vs USD in 3 months`
        : `Currency ${Math.abs(c.raw_value).toFixed(1)}% stronger vs USD in 3 months`;
    case 'job_postings_momentum':
      return `Job postings ${signed(c.raw_value)}% in 90 days`;
    case 'active_disasters':
      return c.raw_value >= 3 ? 'Red disaster alert (last 30 days)' : c.raw_value >= 2 ? 'Orange disaster alert (last 30 days)' : 'No major disaster alert';
    default:
      return label;
  }
}

/** The contributor pushing the score furthest from "normal" (50), ignoring the neutral disaster default. */
export function topDriver(contributors: LiveContributor[]): LiveContributor | null {
  const candidates = contributors.filter(c => !(c.signal_id === 'active_disasters' && c.stress_score <= 50));
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (Math.abs(b.stress_score - 50) * b.weight > Math.abs(a.stress_score - 50) * a.weight ? b : a));
}

/** Newest upstream observation across substantive signals (what the reader should call "data as of"). */
export function newestReference(rows: Iterable<LiveCountry>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    for (const c of r.contributors) {
      if (c.signal_id === 'active_disasters') continue;
      if (!best || c.reference_date > best) best = c.reference_date;
    }
  }
  return best;
}

/** Anon-key client for server components (returns null when env is missing). */
export async function anonClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key);
}

export async function loadLiveCountry(code: string): Promise<LiveCountry | null> {
  const sb = await anonClient();
  if (!sb) return null;
  return (await loadLatestLive(sb)).get(code.toUpperCase()) ?? null;
}
