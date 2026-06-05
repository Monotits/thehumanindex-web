/**
 * GET /api/research/[slug]?locale=&country=
 *
 * Single research article with full body_markdown. Falls back to en when
 * the requested locale doesn't have the article yet.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

interface ResearchFullRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  topic_id: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  body_markdown: string;
  related_indicators: string[];
  related_meta_indexes: string[];
  related_terms: string[];
  data_snapshot: unknown;
  sources: unknown;
  word_count: number | null;
  reading_time_min: number | null;
  generated_by: string | null;
  generated_at: string;
  published_at: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'Invalid slug' }, { status: 400 });
  }

  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') || 'en').toLowerCase();
  const country = (url.searchParams.get('country') || '').toUpperCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const sb = createClient(supabaseUrl, anonKey);

  async function fetchOne(targetLocale: string, targetCountry: string | null) {
    let q = sb
      .from('research_articles')
      .select('*')
      .eq('slug', slug)
      .eq('locale', targetLocale);
    if (targetCountry) q = q.eq('country_code', targetCountry);
    return await q.maybeSingle();
  }

  let result = await fetchOne(locale, country || null);
  let fallbackUsed: string | null = null;

  if (!result.data && locale !== 'en') {
    fallbackUsed = `en/${country || 'any'}`;
    result = await fetchOne('en', country || null);
  }
  if (!result.data && country) {
    fallbackUsed = `${locale}/any-country`;
    result = await fetchOne(locale, null);
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json(
      { ok: false, error: `Article "${slug}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requested: { slug, locale, country: country || null },
      fallback_used: fallbackUsed,
      article: result.data as ResearchFullRow,
    },
    {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
    }
  );
}
