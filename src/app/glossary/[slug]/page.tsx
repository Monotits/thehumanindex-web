import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { renderMarkdown } from '@/lib/ui/markdown';
import { getActiveLocale } from '@/lib/ui/locale';
import { META_INDEXES, type MetaIndex } from '@/lib/ui/tokens';

export const dynamic = 'force-dynamic';

interface GlossaryEntry {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  term: string;
  short_definition: string;
  body_markdown: string;
  related_indicators: string[] | null;
  related_meta_indexes: string[] | null;
  related_terms: string[] | null;
  sources: Array<{ name: string; url?: string }> | null;
  published_at: string;
}

interface RelatedTermLite {
  slug: string;
  term: string;
  short_definition: string;
}

async function loadEntry(slug: string, locale: string) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return { entry: null, related: [] as RelatedTermLite[] };
  }
  const sb = createClient(sbUrl, sbKey);

  const select =
    'id, slug, country_code, locale, term, short_definition, body_markdown, related_indicators, related_meta_indexes, related_terms, sources, published_at';

  // Try requested locale + global country
  let res = await sb
    .from('glossary_entries')
    .select(select)
    .eq('slug', slug)
    .eq('locale', locale)
    .eq('country_code', 'global')
    .maybeSingle();

  if (!res.data && locale !== 'en') {
    res = await sb
      .from('glossary_entries')
      .select(select)
      .eq('slug', slug)
      .eq('locale', 'en')
      .eq('country_code', 'global')
      .maybeSingle();
  }

  const entry = res.data as GlossaryEntry | null;
  if (!entry) return { entry: null, related: [] as RelatedTermLite[] };

  // Related terms: resolve slugs to full term + short definition
  const relSlugs = (entry.related_terms ?? []).filter(Boolean).slice(0, 8);
  let related: RelatedTermLite[] = [];
  if (relSlugs.length > 0) {
    const relRes = await sb
      .from('glossary_entries')
      .select('slug, term, short_definition')
      .in('slug', relSlugs)
      .eq('locale', entry.locale)
      .eq('country_code', 'global');
    related = (relRes.data ?? []) as RelatedTermLite[];
  }

  return { entry, related };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return { title: 'Glossary — The Human Index' };

  const sb = createClient(sbUrl, sbKey);
  const res = await sb
    .from('glossary_entries')
    .select('term, short_definition')
    .eq('slug', slug)
    .eq('locale', 'en')
    .eq('country_code', 'global')
    .maybeSingle();

  const data = res.data as { term: string; short_definition: string } | null;
  if (!data) return { title: 'Glossary — The Human Index' };

  return {
    title: `${data.term} — Glossary | The Human Index`,
    description: data.short_definition,
    alternates: { canonical: `https://thehumanindex.org/glossary/${slug}` },
  };
}

export default async function GlossaryEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getActiveLocale();
  const { entry, related } = await loadEntry(slug, locale);

  if (!entry) notFound();

  const fallbackUsed = entry.locale !== locale;
  const html = renderMarkdown(entry.body_markdown);

  const validMeta = (entry.related_meta_indexes ?? []).filter(
    (m): m is MetaIndex => (META_INDEXES as readonly string[]).includes(m),
  );

  return (
    <article className="min-h-screen">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-6 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/glossary" className="hover:text-foreground transition-colors">
              ← Glossary
            </Link>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance mb-4">
            {entry.term}
          </h1>

          <p className="text-lg sm:text-xl text-foreground-muted text-pretty max-w-2xl leading-relaxed">
            {entry.short_definition}
          </p>

          {/* Meta badges + fallback */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {validMeta.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {validMeta.map((m) => (
                  <MetaCategoryBadge key={m} meta={m} variant="pill" size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="prose prose-thi"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>

      {/* ── SOURCES ── */}
      {entry.sources && entry.sources.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium mb-4">
            Sources
          </h2>
          <ul className="space-y-2 text-sm">
            {entry.sources.map((s, i) => (
              <li key={i} className="text-foreground-muted">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline underline-offset-2"
                  >
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── RELATED ── */}
      {related.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-6">
            See also
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/glossary/${r.slug}`}
                  className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-4 transition-colors h-full"
                >
                  <h3 className="font-serif text-base font-semibold mb-1 group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                    {r.term}
                  </h3>
                  <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                    {r.short_definition}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── BACK ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
        <Link
          href="/glossary"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground"
        >
          ← All glossary terms
        </Link>
      </section>
    </article>
  );
}
