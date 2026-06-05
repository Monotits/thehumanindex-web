/**
 * GET /api/glossary
 *
 * Public listing of glossary entries with optional filters.
 *
 * Query params:
 *   locale       — BCP-47 (en, tr, ...). Default 'en'.
 *   country      — ISO2 code or 'global'. Default 'global'.
 *   q            — case-insensitive search across term + short_definition
 *   meta         — economic | social | mental | technological | environmental
 *                  Filters entries whose related_meta_indexes contains this.
 *   indicator    — indicator_id. Filters entries whose related_indicators
 *                  array contains this.
 *   limit        — max rows (default 50, capped at 200)
 *   offset       — pagination offset
 *
 * Falls back to ('global', 'en') when the requested (locale, country) has no
 * entries — so an early-stage non-English locale doesn't render an empty page.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const MAX_LIMIT = 200;

interface GlossaryRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  term: string;
  short_definition: string;
  related_indicators: string[];
  related_meta_indexes: string[];
  related_terms: string[];
  published_at: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') || 'en').toLowerCase();
  const country = (url.searchParams.get('country') || 'global').toUpperCase();
  const q = url.searchParams.get('q')?.trim() ?? '';
  const meta = url.searchParams.get('meta')?.toLowerCase() ?? '';
  const indicator = url.searchParams.get('indicator') ?? '';
  const limit = Math.min(
    Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50,
    MAX_LIMIT
  );
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const sb = createClient(supabaseUrl, anonKey);

  // Country code is 'global' for cross-cutting terms; otherwise ISO2.
  // We pass the normalized country through as-is.
  const countryFilter = country === 'GLOBAL' ? 'global' : country;

  async function fetchFor(targetCountry: string, targetLocale: string) {
    let query = sb
      .from('glossary_entries')
      .select(
        'id,slug,country_code,locale,term,short_definition,related_indicators,related_meta_indexes,related_terms,published_at',
        { count: 'exact' }
      )
      .eq('country_code', targetCountry)
      .eq('locale', targetLocale);

    if (q.length > 0) {
      const safeQ = q.replace(/[%_]/g, ''); // strip wildcards from user input
      query = query.or(`term.ilike.%${safeQ}%,short_definition.ilike.%${safeQ}%`);
    }
    if (meta.length > 0) {
      query = query.contains('related_meta_indexes', [meta]);
    }
    if (indicator.length > 0) {
      query = query.contains('related_indicators', [indicator]);
    }
    query = query.order('term', { ascending: true }).range(offset, offset + limit - 1);
    return await query;
  }

  // Primary fetch
  let result = await fetchFor(countryFilter, locale);

  // Fallback chain: requested → global/locale → global/en
  let fallbackUsed: string | null = null;
  if ((result.error || (result.data ?? []).length === 0) && countryFilter !== 'global') {
    fallbackUsed = `global/${locale}`;
    result = await fetchFor('global', locale);
  }
  if ((result.error || (result.data ?? []).length === 0) && locale !== 'en') {
    fallbackUsed = 'global/en';
    result = await fetchFor('global', 'en');
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  const rows = (result.data ?? []) as GlossaryRow[];

  return NextResponse.json(
    {
      ok: true,
      locale,
      country: countryFilter,
      fallback_used: fallbackUsed,
      total: result.count ?? rows.length,
      offset,
      limit,
      entries: rows,
    },
    {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    }
  );
}
