import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { META_INDEXES, type MetaIndex } from '@/lib/ui/tokens';
import { getActiveLocale } from '@/lib/ui/locale';

export const metadata: Metadata = {
  title: 'Research — The Human Index',
  description:
    'In-depth research articles on civilizational stress: per-country and per-topic analyses linking specific indicators to broader meta-indexes. Updated continuously.',
  alternates: { canonical: 'https://thehumanindex.org/research' },
};

// Locale-aware: dynamic so we re-render per NEXT_LOCALE cookie.
export const dynamic = 'force-dynamic';

interface ResearchRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  topic_id: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  related_indicators: string[] | null;
  related_meta_indexes: string[] | null;
  reading_time_min: number | null;
  published_at: string;
}

async function loadResearch(locale: string): Promise<{
  articles: ResearchRow[];
  countryNames: Map<string, { name: string; flag: string | null }>;
  fallbackUsed: boolean;
}> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey)
    return { articles: [], countryNames: new Map(), fallbackUsed: false };

  const sb = createClient(sbUrl, sbKey);

  // Try requested locale first; if empty, fall back to English
  let articlesRes = await sb
    .from('research_articles')
    .select(
      'id, slug, country_code, locale, topic_id, title, subtitle, excerpt, related_indicators, related_meta_indexes, reading_time_min, published_at',
    )
    .eq('locale', locale)
    .order('published_at', { ascending: false })
    .limit(24);

  let fallbackUsed = false;
  if (!articlesRes.data || articlesRes.data.length === 0) {
    if (locale !== 'en') {
      fallbackUsed = true;
      articlesRes = await sb
        .from('research_articles')
        .select(
          'id, slug, country_code, locale, topic_id, title, subtitle, excerpt, related_indicators, related_meta_indexes, reading_time_min, published_at',
        )
        .eq('locale', 'en')
        .order('published_at', { ascending: false })
        .limit(24);
    }
  }

  const countriesRes = await sb
    .from('countries')
    .select('code, name, flag_emoji')
    .eq('active', true);

  const articles = (articlesRes.data ?? []) as ResearchRow[];
  const countryNames = new Map(
    (countriesRes.data ?? []).map((r) => [
      (r as { code: string }).code,
      {
        name: (r as { name: string }).name,
        flag: (r as { flag_emoji: string | null }).flag_emoji,
      },
    ]),
  );
  return { articles, countryNames, fallbackUsed };
}

export default async function ResearchPage() {
  const locale = await getActiveLocale();
  const { articles, countryNames, fallbackUsed } = await loadResearch(locale);

  // Group: featured (first 2) + rest
  const featured = articles.slice(0, 2);
  const rest = articles.slice(2);

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Research
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Long-form analysis grounded in indicators.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Each piece connects specific indicators to a broader meta-index narrative.
              Every claim is traceable back to its source.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURED ── */}
      {featured.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-2 gap-6">
            {featured.map((a) => (
              <FeaturedArticleCard
                key={a.id}
                article={a}
                country={countryNames.get(a.country_code)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── REST ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        {rest.length === 0 && featured.length === 0 ? (
          <div className="text-foreground-muted text-sm py-10 text-center">
            No research articles published yet.
          </div>
        ) : (
          <>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-6">
              More analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  country={countryNames.get(a.country_code)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ── Cards ──────────────────────────────────────────────────────────

function FeaturedArticleCard({
  article,
  country,
}: {
  article: ResearchRow;
  country: { name: string; flag: string | null } | undefined;
}) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className="group block rounded-lg border border-border bg-background-alt/30 hover:bg-background-alt p-7 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-3">
        {country && (
          <>
            <span className="text-base" aria-hidden="true">{country.flag ?? '🌐'}</span>
            <span>{country.name}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <time dateTime={article.published_at} className="tabular-nums">
          {new Date(article.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
        {article.reading_time_min && (
          <>
            <span aria-hidden="true">·</span>
            <span>{article.reading_time_min} min read</span>
          </>
        )}
      </div>
      <h3 className="font-serif text-2xl font-semibold leading-snug mb-3 text-balance group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
        {article.title}
      </h3>
      {article.subtitle && (
        <p className="text-foreground-muted text-base mb-4 text-pretty">
          {article.subtitle}
        </p>
      )}
      <p className="text-sm text-foreground-muted line-clamp-3 mb-4">
        {article.excerpt}
      </p>
      <MetaTags meta={article.related_meta_indexes} />
    </Link>
  );
}

function ArticleCard({
  article,
  country,
}: {
  article: ResearchRow;
  country: { name: string; flag: string | null } | undefined;
}) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-5 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-2">
        {country && (
          <>
            <span className="text-sm" aria-hidden="true">{country.flag ?? '🌐'}</span>
            <span>{country.name}</span>
          </>
        )}
      </div>
      <h3 className="font-serif text-lg font-semibold leading-snug mb-2 text-balance group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
        {article.title}
      </h3>
      <p className="text-xs text-foreground-muted tabular-nums mb-3">
        <time dateTime={article.published_at}>
          {new Date(article.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
        {article.reading_time_min && <> · {article.reading_time_min} min</>}
      </p>
      <p className="text-sm text-foreground-muted line-clamp-2 mb-3">{article.excerpt}</p>
      <MetaTags meta={article.related_meta_indexes} />
    </Link>
  );
}

function MetaTags({ meta }: { meta: string[] | null }) {
  if (!meta || meta.length === 0) return null;
  const valid = meta.filter((m): m is MetaIndex =>
    (META_INDEXES as readonly string[]).includes(m),
  );
  if (valid.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {valid.slice(0, 3).map((m) => (
        <MetaCategoryBadge key={m} meta={m} variant="pill" size="sm" />
      ))}
    </div>
  );
}
