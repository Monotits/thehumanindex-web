/**
 * GET /api/glossary/[slug]?locale=&country=
 *
 * Single glossary entry by slug with full body_markdown. Falls back to
 * global/locale → global/en when the requested (country, locale) doesn't
 * have the term yet. Returns related entries for navigation.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

interface GlossaryFullRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  term: string;
  short_definition: string;
  body_markdown: string;
  related_indicators: string[];
  related_meta_indexes: string[];
  related_terms: string[];
  data_snapshot: unknown;
  sources: unknown;
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
  const country = (url.searchParams.get('country') || 'global').toUpperCase();
  const countryFilter = country === 'GLOBAL' ? 'global' : country;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const sb = createClient(supabaseUrl, anonKey);

  async function fetchOne(targetCountry: string, targetLocale: string) {
    return await sb
      .from('glossary_entries')
      .select(
        'id,slug,country_code,locale,term,short_definition,body_markdown,related_indicators,related_meta_indexes,related_terms,data_snapshot,sources,generated_by,generated_at,published_at'
      )
      .eq('slug', slug)
      .eq('country_code', targetCountry)
      .eq('locale', targetLocale)
      .maybeSingle();
  }

  let result = await fetchOne(countryFilter, locale);
  let fallbackUsed: string | null = null;

  if (!result.data && countryFilter !== 'global') {
    fallbackUsed = `global/${locale}`;
    result = await fetchOne('global', locale);
  }
  if (!result.data && locale !== 'en') {
    fallbackUsed = 'global/en';
    result = await fetchOne('global', 'en');
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json(
      { ok: false, error: `Term "${slug}" not found` },
      { status: 404 }
    );
  }

  const entry = result.data as GlossaryFullRow;

  // Related-term hydration (best effort)
  let relatedHydrated: { slug: string; term: string; short_definition: string }[] = [];
  if (entry.related_terms && entry.related_terms.length > 0) {
    const { data: relatedRows } = await sb
      .from('glossary_entries')
      .select('slug,term,short_definition')
      .in('slug', entry.related_terms)
      .eq('country_code', entry.country_code)
      .eq('locale', entry.locale);
    relatedHydrated = (relatedRows ?? []) as typeof relatedHydrated;
  }

  return NextResponse.json(
    {
      ok: true,
      requested: { slug, locale, country: countryFilter },
      fallback_used: fallbackUsed,
      entry,
      related_terms_hydrated: relatedHydrated,
    },
    {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
    }
  );
}
