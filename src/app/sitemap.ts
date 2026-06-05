/**
 * Dynamic sitemap generation
 *
 * Pulls live content from Supabase and emits URLs across every locale.
 * Uses next-intl's as-needed prefix: English at /, others at /<locale>/.
 *
 * Coverage (current — kept tight to actual existing routes):
 *   - Static pages × LOCALES with hreflang alternates
 *   - Pulse pages: /pulse/<slug> for each commentary row (slug encodes country)
 *   - Glossary entries: /glossary/<slug> per (country, locale)
 *   - (Optional / probed) /research, /research/<slug> if pages exist
 *
 * Not yet listed (will turn on as UI ships them):
 *   - /country/<code>
 *   - /transparency/<code>
 *   - /trends/<country>/<indicator>
 *
 * Re-validated every hour. Stays well under sitemap protocol limits.
 */

import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';

export const revalidate = 3600; // 1 hour

const BASE = 'https://thehumanindex.org';

function localizedUrl(path: string, locale: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return `${BASE}${cleanPath}`;
  return `${BASE}/${locale}${cleanPath}`;
}

function buildAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = localizedUrl(path, l);
  return out;
}

interface MinPulse {
  country_code: string | null;
  locale: string | null;
  slug: string;
  published_at: string;
}
interface MinGlossary {
  country_code: string;
  locale: string;
  slug: string;
  published_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const out: MetadataRoute.Sitemap = [];

  // ── Static pages × locales with hreflang ──
  const staticPaths: Array<[
    string,
    MetadataRoute.Sitemap[0]['changeFrequency'],
    number,
  ]> = [
    ['/',              'daily',   1.0],
    ['/dashboard',     'daily',   0.9],
    ['/pulse',         'weekly',  0.8],
    ['/glossary',      'weekly',  0.7],
    ['/data-sources',  'weekly',  0.6],
    ['/methodology',   'monthly', 0.6],
    ['/about',         'monthly', 0.5],
    ['/contact',       'yearly',  0.3],
    ['/quiz',          'monthly', 0.6],
    ['/quiz/result',   'monthly', 0.4],
    ['/global',        'daily',   0.85], // legacy country-style landing
  ];

  for (const [path, changeFrequency, priority] of staticPaths) {
    for (const locale of LOCALES) {
      out.push({
        url: localizedUrl(path, locale),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: buildAlternates(path) },
      });
    }
  }

  // ── Dynamic content from Supabase ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return out;

  const sb = createClient(supabaseUrl, anonKey);

  const [pulsesRes, glossaryRes] = await Promise.all([
    sb
      .from('commentary')
      .select('country_code,locale,slug,published_at')
      .eq('type', 'weekly_pulse')
      .order('published_at', { ascending: false })
      .limit(5000),
    sb
      .from('glossary_entries')
      .select('country_code,locale,slug,published_at')
      .order('published_at', { ascending: false })
      .limit(20000),
  ]);

  // ── Pulse pages ──
  // Current page route is /pulse/[slug] (no country segment in URL — the
  // slug itself encodes the country, e.g. weekly-pulse-us-2026-w23).
  const pulses = (pulsesRes.data ?? []) as MinPulse[];
  const seenPulse = new Set<string>();
  for (const p of pulses) {
    const locale = p.locale || DEFAULT_LOCALE;
    if (!LOCALES.includes(locale as (typeof LOCALES)[number])) continue;
    const key = `${locale}|${p.slug}`;
    if (seenPulse.has(key)) continue;
    seenPulse.add(key);
    out.push({
      url: localizedUrl(`/pulse/${p.slug}`, locale),
      lastModified: p.published_at,
      changeFrequency: 'monthly',
      priority: 0.75,
    });
  }

  // ── Glossary entries ──
  // Page route is /glossary/[slug]. The (country, locale) selection happens
  // server-side via query, but each (slug, locale) pair gets its own URL.
  const glossary = (glossaryRes.data ?? []) as MinGlossary[];
  const seenGlossary = new Set<string>();
  for (const g of glossary) {
    const locale = g.locale || DEFAULT_LOCALE;
    if (!LOCALES.includes(locale as (typeof LOCALES)[number])) continue;
    const key = `${locale}|${g.slug}`;
    if (seenGlossary.has(key)) continue;
    seenGlossary.add(key);
    out.push({
      url: localizedUrl(`/glossary/${g.slug}`, locale),
      lastModified: g.published_at,
      changeFrequency: 'monthly',
      priority: 0.65,
    });
  }

  return out;
}
