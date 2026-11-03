/**
 * GET /share/live?format=story|square → "where pressure is rising" card from
 * the Live layer. Only countries above the normal band (>60) are called
 * "rising"; when fewer than three are, the card shows the gauge instead.
 */

import { describeContributor, topDriver, type LiveContributor } from '@/lib/live/present';
import { anonClient, monthLabel, notFound, parseFormat } from '@/lib/share/kit';
import { renderListCard } from '@/lib/share/listCard';

export const runtime = 'edge';

export async function GET(req: Request) {
  const sb = anonClient();
  if (!sb) return notFound();
  const format = parseFormat(req);
  const [live, countries] = await Promise.all([
    sb.from('v_country_latest_live').select('country_code, live_score, live_score_7d, contributors'),
    sb.from('countries').select('code, name, flag_emoji').eq('active', true),
  ]);
  const cmap = new Map(((countries.data ?? []) as { code: string; name: string; flag_emoji: string | null }[]).map(c => [c.code, c]));
  const rows = ((live.data ?? []) as { country_code: string; live_score: number; live_score_7d: number | null; contributors: LiveContributor[] }[])
    .filter(r => cmap.has(r.country_code))
    .map(r => {
      const s = Number(r.live_score_7d ?? r.live_score);
      const d = topDriver(r.contributors ?? []);
      return { cc: r.country_code, s, sub: d ? describeContributor(d) : undefined };
    })
    .sort((a, b) => b.s - a.s);
  if (!rows.length) return notFound();
  const rising = rows.filter(r => r.s > 60);
  const shown = rising.length >= 3 ? rising : rows;
  return renderListCard({
    format,
    topRight: `LIVE · ${monthLabel()}`,
    kicker: 'LIVE SIGNALS · LAST 7 DAYS',
    title: rising.length >= 3 ? 'WHERE PRESSURE IS RISING' : 'LIVE PRESSURE RIGHT NOW',
    rows: shown.map(r => ({ flag: cmap.get(r.cc)!.flag_emoji ?? '', name: cmap.get(r.cc)!.name, value: r.s.toFixed(0), sub: r.sub })),
    tone: 'hot',
    hook: 'What’s moving in your country?',
    note: '50 = normal for each country',
  });
}
