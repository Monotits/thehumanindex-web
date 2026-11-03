/** GET /share/pulse/{slug}?format=story|square → Weekly Pulse headline card. */

import { anonClient, notFound, parseFormat } from '@/lib/share/kit';
import { renderArticleCard } from '@/lib/share/articleCard';
import { countryRank } from '@/lib/share/countryRank';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = anonClient();
  if (!sb) return notFound();
  const res = await sb.from('commentary').select('slug, title, country_code').eq('slug', slug).limit(1).maybeSingle();
  if (!res.data) return notFound();
  const p = res.data as { slug: string; title: string; country_code: string | null };
  return renderArticleCard({
    format: parseFormat(req), kind: 'WEEKLY PULSE', title: p.title,
    country: await countryRank(sb, p.country_code), path: `/pulse/${p.slug}`,
  });
}
