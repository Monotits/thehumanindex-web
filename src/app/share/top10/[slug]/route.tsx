/** GET /share/top10/{slug}?format=story|square → ranked-list share card for a Top-10 page. */

import { getTop10Entry } from '@/lib/ui/top10-catalog';
import { anonClient, monthLabel, notFound, parseFormat } from '@/lib/share/kit';
import { renderListCard } from '@/lib/share/listCard';
import { loadRanking } from '@/lib/share/rankings';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getTop10Entry(slug);
  const sb = anonClient();
  if (!entry || !sb) return notFound();
  const format = parseFormat(req);
  const { rows, total } = await loadRanking(sb, entry.source, entry.direction);
  if (!rows.length) return notFound();
  const title = entry.title.replace(/^the\s+10\s+/i, '').replace(/\s+in\s+\d{4}$/i, '').toUpperCase();
  return renderListCard({
    format,
    topRight: `TOP 10 · ${monthLabel()}`,
    kicker: `OUT OF ${total} COUNTRIES`,
    title,
    rows: rows.map(r => ({ flag: r.flag, name: r.name, value: r.display })),
    tone: entry.direction === 'most' ? 'hot' : 'calm',
    hook: 'Where does your country rank?',
    path: `/top-10/${slug}`.length <= 30 ? `/top-10/${slug}` : undefined,
  });
}
