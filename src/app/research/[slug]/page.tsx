import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { renderMarkdown } from '@/lib/ui/markdown';
import { NewsletterCTA } from '@/components/ui/NewsletterCTA';
import { ShareButton } from '@/components/ui/ShareButton';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import { effectiveStatus, type ResearchStatus } from '@/lib/research/publishable';

// Articles change rarely; 10 min ISR keeps DB load flat without staleness risk.
export const revalidate = 600;

// No build-time params: each article is rendered on first hit, then cached
// (without this the route stays fully dynamic and `revalidate` is ignored).
export async function generateStaticParams() {
  return [];
}

const BASE = 'https://thehumanindex.org';

interface ResearchArticle {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  body_markdown: string;
  related_indicators: string[] | null;
  data_snapshot: unknown;
  sources: unknown;
  reading_time_min: number | null;
  generated_at: string | null;
  published_at: string;
  updated_at?: string | null;
  status?: string | null;
  status_note?: string | null;
}

interface SourceLink {
  name: string;
  url: string | null;
}

async function loadArticle(slug: string): Promise<{
  article: ResearchArticle | null;
  country: { code: string; name: string; flag_emoji: string | null } | null;
  indicatorNames: Map<string, string>;
}> {
  const none = { article: null, country: null, indicatorNames: new Map<string, string>() };
  if (!/^[a-z0-9-]+$/.test(slug)) return none;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return none;
  const sb = createClient(sbUrl, sbKey);

  // slug is unique per (country, locale) — not globally. Newest English wins.
  const res = await sb
    .from('research_articles')
    .select('*')
    .eq('slug', slug)
    .eq('locale', 'en')
    .order('published_at', { ascending: false })
    .limit(1);
  const article = ((res.data ?? [])[0] as ResearchArticle | undefined) ?? null;
  if (!article) return none;

  const related = article.related_indicators ?? [];
  const [countryRes, indicatorsRes] = await Promise.all([
    article.country_code && article.country_code !== 'global'
      ? sb.from('countries').select('code, name, flag_emoji').eq('code', article.country_code).maybeSingle()
      : Promise.resolve({ data: null }),
    related.length > 0
      ? sb.from('indicators').select('id, name').eq('active', true).in('id', related)
      : Promise.resolve({ data: [] }),
  ]);

  const indicatorNames = new Map<string, string>();
  for (const r of (indicatorsRes.data ?? []) as Array<{ id: string; name: string }>) {
    indicatorNames.set(r.id, r.name);
  }

  return {
    article,
    country: (countryRes.data as { code: string; name: string; flag_emoji: string | null } | null) ?? null,
    indicatorNames,
  };
}

function parseSources(raw: unknown): SourceLink[] {
  if (!Array.isArray(raw)) return [];
  const out: SourceLink[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ name: item.trim(), url: null });
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const name = typeof o.name === 'string' ? o.name : typeof o.title === 'string' ? o.title : null;
      const url = typeof o.url === 'string' && /^https?:\/\//.test(o.url) ? o.url : null;
      if (name || url) out.push({ name: name ?? url!, url });
    }
  }
  return out;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await loadArticle(slug);
  if (!article) return { title: 'Research', robots: { index: false } };

  const status = effectiveStatus(article);
  const canonical = `${BASE}/research/${article.slug}`;
  if (status !== 'published') {
    return {
      title: `${article.title} (withdrawn)`,
      robots: { index: false, follow: true },
      alternates: { canonical },
    };
  }
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonical,
      type: 'article',
      siteName: 'The Human Index',
      publishedTime: article.published_at,
      ...(article.updated_at && { modifiedTime: article.updated_at }),
    },
    alternates: { canonical },
  };
}

export default async function ResearchArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { article, country, indicatorNames } = await loadArticle(slug);
  if (!article) notFound();

  const status: ResearchStatus = effectiveStatus(article);
  if (status !== 'published') {
    return <WithdrawnNotice article={article} status={status} />;
  }

  // Empty body must not return a 200 article shell.
  if (!article.body_markdown || article.body_markdown.trim().length < 200) notFound();

  const html = renderMarkdown(article.body_markdown);
  const sources = parseSources(article.sources);
  const related = (article.related_indicators ?? []).filter((id) => indicatorNames.has(id));
  const dataAsOf = article.generated_at ?? article.published_at;

  return (
    <article className="min-h-screen">
      <ArticleJsonLd
        title={article.title}
        description={article.excerpt}
        slug={article.slug}
        publishedAt={article.published_at}
        modifiedAt={article.updated_at}
        section="research"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: BASE },
          { name: 'Research', url: `${BASE}/research` },
          { name: article.title, url: `${BASE}/research/${article.slug}` },
        ]}
      />

      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-6 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/research" className="hover:text-foreground transition-colors">
              ← Research
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-4">
            {country ? (
              <>
                <span className="text-base" aria-hidden="true">{country.flag_emoji ?? '🌐'}</span>
                <Link href={`/country/${country.code.toLowerCase()}`} className="hover:text-foreground transition-colors">
                  {country.name}
                </Link>
              </>
            ) : (
              <>
                <span className="text-base" aria-hidden="true">🌐</span>
                <span>Global</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>Research</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="mt-4 text-lg text-foreground-muted text-pretty">{article.subtitle}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-foreground-muted">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <time dateTime={article.published_at} className="tabular-nums">
                {longDate(article.published_at)}
              </time>
              {article.updated_at && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated{' '}
                    <time dateTime={article.updated_at} className="tabular-nums">
                      {longDate(article.updated_at)}
                    </time>
                  </span>
                </>
              )}
              {article.reading_time_min && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{article.reading_time_min} min read</span>
                </>
              )}
            </div>
            <ShareButton
              url={`/research/${article.slug}`}
              title={article.title}
              text={`${article.title} — The Human Index`}
              surface="research_reader"
              variant="full"
            />
          </div>
        </div>
      </header>

      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <aside
          className="mb-8 rounded-lg border border-border bg-background-alt/40 px-4 py-3 text-sm text-foreground-muted"
          aria-label="About this analysis"
        >
          <strong className="text-foreground font-medium">
            Figures reflect the index as of {longDate(dataAsOf)}.
          </strong>{' '}
          This analysis was drafted with AI assistance from The Human Index dataset; numbers quoted
          here are a snapshot and may differ from the live{' '}
          {country ? (
            <Link href={`/country/${country.code.toLowerCase()}`} className="underline underline-offset-2">
              {country.name} page
            </Link>
          ) : (
            <Link href="/countries" className="underline underline-offset-2">country pages</Link>
          )}
          . Spot an error?{' '}
          <Link href="/contact" className="underline underline-offset-2">Tell us</Link>.
        </aside>

        <div className="prose prose-thi" dangerouslySetInnerHTML={{ __html: html }} />
      </section>

      {related.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
          <h2 className="font-serif text-xl font-semibold mb-4">Indicators used</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((id) => (
              <li key={id}>
                <Link
                  href={`/indicator/${id}`}
                  className="inline-block rounded-full border border-border px-3 py-1 text-sm text-foreground-muted hover:text-foreground hover:bg-background-alt/60 transition-colors"
                >
                  {indicatorNames.get(id)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sources.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
          <h2 className="font-serif text-xl font-semibold mb-4">Sources</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground-muted">
            {sources.map((s, i) => (
              <li key={`${s.name}-${i}`}>
                {s.url ? (
                  <a href={s.url} rel="noopener noreferrer nofollow" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-foreground-subtle">
            Method and weights: <Link href="/methodology" className="underline underline-offset-2">Methodology</Link>.
          </p>
        </section>
      )}

      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <NewsletterCTA variant="inline" />
      </section>

      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
        <Link href="/research" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
          ← All research
        </Link>
      </section>
    </article>
  );
}

function WithdrawnNotice({ article, status }: { article: ResearchArticle; status: ResearchStatus }) {
  return (
    <div className="min-h-screen">
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
          Research · {status === 'retracted' ? 'Retracted' : 'Withdrawn for review'}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-balance">
          {article.title}
        </h1>
        <p className="mt-6 text-foreground-muted text-pretty">
          {article.status_note ??
            'This analysis cited an indicator we have since retired: it applied a single global value to every country, so the country-specific claims built on it were not supported by the data. We have withdrawn the piece rather than leave it online uncorrected.'}
        </p>
        <p className="mt-4 text-foreground-muted">
          Current, sourced figures are on the{' '}
          <Link href="/countries" className="underline underline-offset-2">country pages</Link>; how we
          handle corrections is described in the{' '}
          <Link href="/methodology" className="underline underline-offset-2">methodology</Link>.
        </p>
        <p className="mt-8">
          <Link href="/research" className="text-sm text-foreground-muted hover:text-foreground">
            ← All research
          </Link>
        </p>
      </section>
    </div>
  );
}
