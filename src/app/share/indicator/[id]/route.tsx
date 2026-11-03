/** GET /share/indicator/{id}?format=story|square → "where it hits hardest" card with raw values. */

import { anonClient, monthLabel, notFound, parseFormat } from '@/lib/share/kit';
import { renderListCard } from '@/lib/share/listCard';
import { loadRanking } from '@/lib/share/rankings';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = anonClient();
  if (!sb || !/^[a-z0-9_]+$/.test(id)) return notFound();
  const format = parseFormat(req);
  const { rows, total, indicator } = await loadRanking(sb, { kind: 'indicator', indicator_id: id }, 'most');
  if (!indicator || !rows.length) return notFound();
  return renderListCard({
    format,
    topRight: `INDICATOR · ${monthLabel()}`,
    kicker: 'WHERE IT HITS HARDEST',
    title: indicator.name.toUpperCase(),
    rows: rows.map(r => ({ flag: r.flag, name: r.name, value: r.display })),
    tone: 'hot',
    hook: 'See all 25 countries',
    note: `${total} countries · latest published values`,
    path: `/indicator/${id}`.length <= 30 ? `/indicator/${id}` : undefined,
  });
}
