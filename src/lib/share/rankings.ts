/**
 * Ranked country lists for share cards: composite, meta-index or a single
 * indicator, sorted from the stressed end (or the calm end). Indicator rows
 * carry the raw value + unit so the card can say "30%" instead of a score.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MetaIndex } from '@/lib/ui/tokens';

export type RankSource =
  | { kind: 'composite' }
  | { kind: 'meta'; meta_index: MetaIndex }
  | { kind: 'indicator'; indicator_id: string };

export interface RankRow { cc: string; name: string; flag: string; score: number; display: string }

export function formatRaw(v: number, unit: string | null): string {
  const n = Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(Math.abs(v) < 1 ? 2 : 1);
  if (!unit) return n;
  const u = unit.trim();
  if (u === '%' || u.startsWith('% ')) return `${n}%`;
  if (/^0-10/.test(u)) return `${n}/10`;
  if (/^0-100/.test(u)) return `${n}/100`;
  return u.length <= 8 ? `${n} ${u}` : n;
}

export async function loadRanking(
  sb: SupabaseClient, source: RankSource, direction: 'most' | 'least',
): Promise<{ rows: RankRow[]; total: number; indicator?: { name: string; unit: string | null; description: string | null } }> {
  const cRes = await sb.from('countries').select('code, name, flag_emoji').eq('active', true);
  const countries = new Map(((cRes.data ?? []) as { code: string; name: string; flag_emoji: string | null }[])
    .map(c => [c.code, { name: c.name, flag: c.flag_emoji ?? '' }]));

  let rows: { cc: string; score: number; display: string }[] = [];
  let indicator: { name: string; unit: string | null; description: string | null } | undefined;
  if (source.kind === 'composite') {
    const r = await sb.from('v_country_latest_composite').select('country_code, score_value');
    rows = ((r.data ?? []) as { country_code: string; score_value: number }[])
      .map(x => ({ cc: x.country_code, score: Number(x.score_value), display: Number(x.score_value).toFixed(1) }));
  } else if (source.kind === 'meta') {
    const r = await sb.from('v_country_latest_meta_indexes').select('country_code, value').eq('meta_index', source.meta_index);
    rows = ((r.data ?? []) as { country_code: string; value: number | null }[])
      .filter(x => x.value !== null)
      .map(x => ({ cc: x.country_code, score: Number(x.value), display: Number(x.value).toFixed(1) }));
  } else {
    const [ind, vals] = await Promise.all([
      sb.from('indicators').select('name, unit, description').eq('id', source.indicator_id).eq('active', true).maybeSingle(),
      sb.from('v_country_latest_indicators').select('country_code, raw_value, normalized_value').eq('indicator_id', source.indicator_id),
    ]);
    if (!ind.data) return { rows: [], total: 0 };
    indicator = ind.data as { name: string; unit: string | null; description: string | null };
    rows = ((vals.data ?? []) as { country_code: string; raw_value: number | null; normalized_value: number | null }[])
      .filter(x => x.normalized_value !== null && x.raw_value !== null)
      .map(x => ({ cc: x.country_code, score: Number(x.normalized_value), display: formatRaw(Number(x.raw_value), indicator!.unit) }));
  }

  rows = rows.filter(r => countries.has(r.cc));
  rows.sort((a, b) => (direction === 'most' ? b.score - a.score : a.score - b.score));
  return {
    total: rows.length,
    indicator,
    rows: rows.map(r => ({ ...r, name: countries.get(r.cc)!.name, flag: countries.get(r.cc)!.flag })),
  };
}
