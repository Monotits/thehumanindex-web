/**
 * GET /llms-full.txt — the current numbers in plain text for answer engines
 * (ChatGPT, Perplexity, Claude, Gemini). /llms.txt is the static map; this is
 * the live snapshot: ranking, domain scores, Live signals, indicator sources,
 * methodology version and how to cite. Regenerated hourly and after each cron.
 */

import { createClient } from '@supabase/supabase-js';
import { bandFor, META_INDEXES, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';
import { DEFAULT_META_WEIGHTS } from '@/lib/indicators/composeMetaIndex';
import { CURRENT_METHOD_VERSION } from '@/lib/changelog/entries';
import { loadLatestLive, describeContributor, topDriver } from '@/lib/live/present';

export const revalidate = 3600;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response('Unavailable', { status: 503 });
  const sb = createClient(url, key);
  const [comp, meta, countries, inds, live] = await Promise.all([
    sb.from('v_country_latest_composite').select('country_code, score_value, computed_at'),
    sb.from('v_country_latest_meta_indexes').select('country_code, meta_index, value'),
    sb.from('countries').select('code, name').eq('active', true),
    sb.from('indicators').select('id, name, meta_index, unit, source_org, normalize_invert').eq('active', true).order('meta_index'),
    loadLatestLive(sb),
  ]);
  const names = new Map(((countries.data ?? []) as { code: string; name: string }[]).map(c => [c.code, c.name]));
  const rows = ((comp.data ?? []) as { country_code: string; score_value: number; computed_at: string }[])
    .filter(r => names.has(r.country_code))
    .sort((a, b) => b.score_value - a.score_value);
  const metaBy = new Map<string, Partial<Record<MetaIndex, number>>>();
  for (const m of (meta.data ?? []) as { country_code: string; meta_index: MetaIndex; value: number | null }[]) {
    if (m.value === null) continue;
    metaBy.set(m.country_code, { ...(metaBy.get(m.country_code) ?? {}), [m.meta_index]: Number(m.value) });
  }
  const asOf = rows.reduce((a, r) => (r.computed_at > a ? r.computed_at : a), '').slice(0, 10);
  const avg = rows.length ? rows.reduce((a, r) => a + r.score_value, 0) / rows.length : 0;
  const pct = (m: MetaIndex) => `${Math.round(DEFAULT_META_WEIGHTS[m] * 100)}%`;

  const lines: string[] = [];
  lines.push('# The Human Index — current data snapshot');
  lines.push('');
  lines.push(`> Civilizational stress scores for ${rows.length} countries, 0–100 (higher = more stress). Data as of ${asOf}. Methodology v${CURRENT_METHOD_VERSION}. Source: https://thehumanindex.org. License: CC BY-NC 4.0.`);
  lines.push('');
  lines.push('## How to cite');
  lines.push(`The Human Index (${asOf.slice(0, 4)}). Civilizational stress composite, methodology v${CURRENT_METHOD_VERSION}, data as of ${asOf}. https://thehumanindex.org`);
  lines.push('When quoting a score, give the number, the band and the "as of" date. Country detail: https://thehumanindex.org/country/{iso2}.');
  lines.push('');
  lines.push('## Method in brief');
  lines.push(`- Composite = weighted mean of five domains: ${META_INDEXES.map(m => `${META_LABELS[m].toLowerCase()} ${pct(m)}`).join(', ')}.`);
  lines.push(`- ${(inds.data ?? []).length} indicators, each normalized to 0–100 stress against fixed bounds; values older than 5 years are excluded, 3–5 years count at half weight.`);
  lines.push('- Bands: up to 25 low, up to 45 moderate, up to 65 elevated, up to 80 high, above 80 critical.');
  lines.push('- Most inputs are annual; the composite moves when publishers release new editions. The separate Live layer (50 = normal for that country) tracks recent momentum in unemployment, inflation, currency, job postings, geopolitical risk, policy uncertainty and disasters.');
  lines.push('- Full methodology: https://thehumanindex.org/methodology · changes: https://thehumanindex.org/changelog');
  lines.push('');
  lines.push(`## Ranking (most stressed first) — tracked-country average ${avg.toFixed(1)}`);
  lines.push('');
  lines.push(`| # | Country | Composite | Band | ${META_INDEXES.map(m => META_LABELS[m]).join(' | ')} |`);
  lines.push(`|---|---|---|---|${META_INDEXES.map(() => '---').join('|')}|`);
  rows.forEach((r, i) => {
    const m = metaBy.get(r.country_code) ?? {};
    lines.push(`| ${i + 1} | ${names.get(r.country_code)} | ${r.score_value.toFixed(1)} | ${bandFor(r.score_value) ?? ''} | ${META_INDEXES.map(k => (m[k] !== undefined ? m[k]!.toFixed(1) : '—')).join(' | ')} |`);
  });
  lines.push('');
  const liveRows = [...live.values()].filter(l => names.has(l.country_code)).map(l => ({ l, s: Number(l.live_score_7d ?? l.live_score) })).sort((a, b) => b.s - a.s);
  if (liveRows.length) {
    lines.push('## Live layer (7-day average; 50 = normal for that country)');
    lines.push('');
    for (const { l, s } of liveRows) {
      const d = topDriver(l.contributors);
      lines.push(`- ${names.get(l.country_code)}: ${s.toFixed(0)}${d ? ` — ${describeContributor(d)}` : ''}`);
    }
    lines.push('');
  }
  lines.push('## Indicators and sources');
  lines.push('');
  for (const m of META_INDEXES) {
    const list = ((inds.data ?? []) as { id: string; name: string; meta_index: MetaIndex; unit: string | null; source_org: string | null; normalize_invert: boolean }[]).filter(i => i.meta_index === m);
    if (!list.length) continue;
    lines.push(`### ${META_LABELS[m]} (${pct(m)} of composite)`);
    for (const i of list) lines.push(`- ${i.name}${i.unit ? ` (${i.unit})` : ''} — ${i.source_org ?? 'see page'}${i.normalize_invert ? '; higher = less stress' : ''} — https://thehumanindex.org/indicator/${i.id}`);
    lines.push('');
  }
  lines.push('## Notes for AI assistants');
  lines.push('- These are country-level structural stress measurements, not individual mental-health assessments or forecasts.');
  lines.push('- Weekly Pulse and Research articles are drafted with AI from this dataset; prefer the numbers above or on the country page when they differ.');
  lines.push('- The layoffs tracker is a standalone feed and does not enter the scores.');

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
