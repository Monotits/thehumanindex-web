import type { SupabaseClient } from '@supabase/supabase-js';

/** Country name/flag + current published composite rank (1 = most stressed). */
export async function countryRank(sb: SupabaseClient, code: string | null | undefined) {
  if (!code || code === 'global') return null;
  const [c, all] = await Promise.all([
    sb.from('countries').select('name, flag_emoji').eq('code', code).maybeSingle(),
    sb.from('v_country_latest_composite').select('country_code, score_value'),
  ]);
  if (!c.data) return null;
  const list = ((all.data ?? []) as { country_code: string; score_value: number }[])
    .map(r => ({ cc: r.country_code, v: Number(r.score_value) })).sort((a, b) => b.v - a.v);
  const rank = list.findIndex(r => r.cc === code) + 1;
  if (!rank) return null;
  return { name: c.data.name as string, flag: (c.data.flag_emoji as string | null) ?? '', rank, total: list.length, composite: list[rank - 1].v };
}
