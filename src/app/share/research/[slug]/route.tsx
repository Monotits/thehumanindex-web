/** GET /share/research/{slug}?format=story|square → Research headline card (published articles only). */

import { anonClient, notFound, parseFormat } from '@/lib/share/kit';
import { renderArticleCard } from '@/lib/share/articleCard';
import { countryRank } from '@/lib/share/countryRank';
import { isPublishable } from '@/lib/research/publishable';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = anonClient();
  if (!sb) return notFound();
  const res = await sb.from('research_articles').select('*').eq('slug', slug).limit(1).maybeSingle();
  if (!res.data || !isPublishable(res.data)) return notFound();
  const a = res.data as { slug: string; title: string; country_code: string | null };
  return renderArticleCard({
    format: parseFormat(req), kind: 'RESEARCH', title: a.title,
    country: await countryRank(sb, a.country_code), path: `/research/${a.slug}`,
  });
}
