/**
 * GET /share/quiz?c=TR&x=47.3&m=economic,social,mental&format=story|square
 * → the visitor's own quiz result as a share card. Inputs are validated and
 * clamped; nothing is stored.
 */

import { META_INDEXES, type MetaIndex } from '@/lib/ui/tokens';
import { anonClient, notFound, parseFormat } from '@/lib/share/kit';
import { renderQuizCard } from '@/lib/share/quizCard';

export const runtime = 'edge';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const code = (q.get('c') ?? '').toUpperCase();
  const x = Number(q.get('x'));
  const metas = (q.get('m') ?? '').split(',').filter((m): m is MetaIndex => (META_INDEXES as readonly string[]).includes(m));
  const sb = anonClient();
  if (!sb || !/^[A-Z]{2}$/.test(code) || !Number.isFinite(x) || metas.length === 0) return notFound();
  const c = await sb.from('countries').select('name, flag_emoji').eq('code', code).maybeSingle();
  if (!c.data) return notFound();
  return renderQuizCard(parseFormat(req), {
    country: { name: c.data.name as string, flag: (c.data.flag_emoji as string | null) ?? '' },
    exposure: Math.max(0, Math.min(100, x)),
    metas: [...new Set(metas)],
  });
}
