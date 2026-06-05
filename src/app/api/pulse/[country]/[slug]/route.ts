/**
 * GET /api/pulse/[country]/[slug]?locale=
 *
 * Single Pulse by (country, slug). Country='global' returns the legacy
 * site-wide weekly pulse. Falls back en if requested locale missing.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

interface PulseFullRow {
  id: string;
  country_code: string | null;
  locale: string | null;
  type: string | null;
  title: string;
  slug: string;
  body_markdown: string;
  composite_score_id: string | null;
  published_at: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ country: string; slug: string }> }
) {
  const { country: rawCountry, slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'Invalid slug' }, { status: 400 });
  }
  const country = rawCountry.toLowerCase() === 'global' ? 'global' : rawCountry.toUpperCase();
  if (country !== 'global' && !/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ ok: false, error: 'Invalid country code' }, { status: 400 });
  }

  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') || 'en').toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const sb = createClient(supabaseUrl, anonKey);

  async function fetchOne(targetLocale: string) {
    return await sb
      .from('commentary')
      .select('id,country_code,locale,type,title,slug,body_markdown,composite_score_id,published_at')
      .eq('slug', slug)
      .eq('country_code', country)
      .eq('locale', targetLocale)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  let result = await fetchOne(locale);
  let fallbackUsed: string | null = null;
  if (!result.data && locale !== 'en') {
    fallbackUsed = 'en';
    result = await fetchOne('en');
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json(
      { ok: false, error: `Pulse "${slug}" not found for ${country}` },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requested: { country, slug, locale },
      fallback_used: fallbackUsed,
      pulse: result.data as PulseFullRow,
    },
    {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' },
    }
  );
}
