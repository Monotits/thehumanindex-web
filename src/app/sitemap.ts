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
import { DEFAULT_LOCALE } from '@/i18n/config';

export const revalidate = 3600; // 1 hour

const BASE = 'https://thehumanindex.org';

interface MinPulse {
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
  // lastModified olarak "şu an" yerine günün tarihi kullanılıyor: sitemap
  // saatlik yeniden üretildiğinde her URL'nin lastmod'unun sahte biçimde
  // oynaması Google'ın sinyale güvenini aşındırıyor. Veri günde bir kez
  // (cron) tazelendiği için gün bazlı lastmod dürüst bir sinyal.
  const today = new Date().toISOString().split('T')[0];
  const out: MetadataRoute.Sitemap = [];

  // ── Static pages × locales with hreflang ──
  const staticPaths: Array<[
    string,
    MetadataRoute.Sitemap[0]['changeFrequency'],
    number,
  ]> = [
    ['/',              'daily',   1.0],
    ['/countries',     'daily',   0.95],
    ['/indicators',    'weekly',  0.9],
    ['/top-10',        'weekly',  0.9],
    ['/topics',        'weekly',  0.9],
    ['/dataset',       'monthly', 0.75],
    ['/pulse',         'weekly',  0.85],
    ['/research',      'weekly',  0.75],
    ['/glossary',      'weekly',  0.7],
    ['/transparency',  'weekly',  0.65],
    ['/data-sources',  'weekly',  0.6],
    ['/methodology',   'monthly', 0.7],
    ['/about',         'monthly', 0.5],
    ['/contact',       'yearly',  0.3],
    ['/quiz',          'monthly', 0.65],
    ['/layoffs',       'daily',   0.7],
  ];

  // English-only after Faz 13 wind-down. The /tr, /de etc. prefixed
  // routes return 404 (no [locale] folder), so emitting them to Google
  // creates broken-link signals. Sticking to the canonical root path
  // for every static surface.
  for (const [path, changeFrequency, priority] of staticPaths) {
    out.push({
      url: `${BASE}${path}`,
      lastModified: today,
      changeFrequency,
      priority,
    });
  }

  // ── Quiz variant landing pages (statik katalog) ──
  const { QUIZ_VARIANTS } = await import('@/lib/ui/quiz-variants');
  for (const v of QUIZ_VARIANTS) {
    out.push({
      url: `${BASE}/quiz/${v.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // ── Dynamic content from Supabase ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return out;

  const sb = createClient(supabaseUrl, anonKey);

  const [pulsesRes, glossaryRes, countriesRes, indicatorsRes] = await Promise.all([
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
    sb.from('countries').select('code').eq('active', true),
    sb.from('indicators').select('id').eq('active', true),
  ]);

  // ── Country detail pages (en only — locale routes come later) ──
  const countries = (countriesRes.data ?? []) as Array<{ code: string }>;
  for (const c of countries) {
    out.push({
      url: `${BASE}/country/${c.code.toLowerCase()}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  // ── Indicator detail pages ──
  const indicators = (indicatorsRes.data ?? []) as Array<{ id: string }>;
  for (const i of indicators) {
    out.push({
      url: `${BASE}/indicator/${i.id}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.85,
    });
  }

  // ── Top-10 ranking pages (catalog-driven, static slugs) ──
  // Imported lazily to avoid widening the bundle from a sitemap edge call.
  const { TOP_10_CATALOG } = await import('@/lib/ui/top10-catalog');
  for (const t of TOP_10_CATALOG) {
    out.push({
      url: `${BASE}/top-10/${t.slug}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.85,
    });
  }

  // ── Topic hub pages ──
  const { TOPIC_CATALOG } = await import('@/lib/ui/topic-catalog');
  for (const t of TOPIC_CATALOG) {
    out.push({
      url: `${BASE}/topics/${t.slug}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.85,
    });
  }

  // ── Pulse pages ──
  // English-only. The slug is unique per (country, locale='en') in the DB
  // now that the wind-down cleanup ran.
  const pulses = (pulsesRes.data ?? []) as MinPulse[];
  const seenPulse = new Set<string>();
  for (const p of pulses) {
    if ((p.locale || DEFAULT_LOCALE) !== DEFAULT_LOCALE) continue;
    if (seenPulse.has(p.slug)) continue;
    seenPulse.add(p.slug);
    out.push({
      url: `${BASE}/pulse/${p.slug}`,
      lastModified: p.published_at,
      changeFrequency: 'monthly',
      priority: 0.75,
    });
  }

  // ── Glossary entries ──
  // English-only.
  const glossary = (glossaryRes.data ?? []) as MinGlossary[];
  const seenGlossary = new Set<string>();
  for (const g of glossary) {
    if ((g.locale || DEFAULT_LOCALE) !== DEFAULT_LOCALE) continue;
    if (seenGlossary.has(g.slug)) continue;
    seenGlossary.add(g.slug);
    out.push({
      url: `${BASE}/glossary/${g.slug}`,
      lastModified: g.published_at,
      changeFrequency: 'monthly',
      priority: 0.65,
    });
  }

  return out;
}
