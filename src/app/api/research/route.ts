/**
 * GET /api/research
 *
 * Public listing of research articles. Filters: locale, country, topic, meta,
 * indicator. Same fallback chain as glossary.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPublishable } from '@/lib/research/publishable';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const MAX_LIMIT = 100;

interface ResearchListRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  topic_id: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  related_indicators: string[];
  related_meta_indexes: string[];
  word_count: number | null;
  reading_time_min: number | null;
  published_at: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') || 'en').toLowerCase();
  const country = (url.searchParams.get('country') || '').toUpperCase();
  const topic = url.searchParams.get('topic') ?? '';
  const meta = url.searchParams.get('meta')?.toLowerCase() ?? '';
  const indicator = url.searchParams.get('indicator') ?? '';
  const limit = Math.min(
    Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20,
    MAX_LIMIT
  );
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const sb = createClient(supabaseUrl, anonKey);

  // `status` exists only after migration 028 — retry without it on error.
  async function fetchFor(targetCountry: string | null, targetLocale: string) {
    const first = await fetchForCols(targetCountry, targetLocale, true);
    if (first.error && /status|column/i.test(first.error.message)) {
      return await fetchForCols(targetCountry, targetLocale, false);
    }
    return first;
  }

  async function fetchForCols(targetCountry: string | null, targetLocale: string, withStatus: boolean) {
    let q = sb
      .from('research_articles')
      .select(
        'id,slug,country_code,locale,topic_id,title,subtitle,excerpt,related_indicators,related_meta_indexes,word_count,reading_time_min,published_at' +
          (withStatus ? ',status' : ''),
        { count: 'exact' }
      )
      .eq('locale', targetLocale);

    if (targetCountry) q = q.eq('country_code', targetCountry);
    if (topic) q = q.eq('topic_id', topic);
    if (meta) q = q.contains('related_meta_indexes', [meta]);
    if (indicator) q = q.contains('related_indicators', [indicator]);

    q = q
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return await q;
  }

  // Primary: requested country + locale (if no country requested, no country filter)
  let result = await fetchFor(country || null, locale);
  let fallbackUsed: string | null = null;

  // Locale fallback when nothing returned
  if ((result.error || (result.data ?? []).length === 0) && locale !== 'en') {
    fallbackUsed = `${country || 'any'}/en`;
    result = await fetchFor(country || null, 'en');
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      locale,
      country: country || null,
      topic: topic || null,
      fallback_used: fallbackUsed,
      total: result.count ?? (result.data ?? []).length,
      offset,
      limit,
      // Publication gate: withdrawn / retired-indicator pieces are never served.
      articles: ((result.data ?? []) as unknown as ResearchListRow[]).filter(isPublishable),
    },
    {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    }
  );
}
