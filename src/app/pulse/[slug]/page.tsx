import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { renderMarkdown } from '@/lib/ui/markdown';
import { getActiveLocale } from '@/lib/ui/locale';
import { NewsletterCTA } from '@/components/ui/NewsletterCTA';

export const dynamic = 'force-dynamic';

interface PulseRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  type: string;
  title: string;
  body_markdown: string;
  published_at: string;
}

interface CountryRow {
  code: string;
  name: string;
  flag_emoji: string | null;
}

interface RelatedRow {
  slug: string;
  title: string;
  published_at: string;
  country_code: string;
}

async function loadPulse(slug: string, locale: string) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return { pulse: null, country: null, related: [] as RelatedRow[] };
  }
  const sb = createClient(sbUrl, sbKey);

  // Try requested locale first
  let res = await sb
    .from('commentary')
    .select('id, slug, country_code, locale, type, title, body_markdown, published_at')
    .eq('slug', slug)
    .eq('locale', locale)
    .maybeSingle();

  if (!res.data && locale !== 'en') {
    // Fallback to English version of the same slug
    res = await sb
      .from('commentary')
      .select('id, slug, country_code, locale, type, title, body_markdown, published_at')
      .eq('slug', slug)
      .eq('locale', 'en')
      .maybeSingle();
  }

  const pulse = res.data as PulseRow | null;
  if (!pulse) return { pulse: null, country: null, related: [] as RelatedRow[] };

  // Country meta
  let country: CountryRow | null = null;
  if (pulse.country_code && pulse.country_code !== 'global') {
    const cRes = await sb
      .from('countries')
      .select('code, name, flag_emoji')
      .eq('code', pulse.country_code)
      .maybeSingle();
    country = cRes.data as CountryRow | null;
  }

  // Related: 3 other pulses (same locale, same country if applicable, exclude self)
  const relRes = await sb
    .from('commentary')
    .select('slug, title, published_at, country_code')
    .eq('type', 'weekly_pulse')
    .eq('locale', pulse.locale)
    .eq('country_code', pulse.country_code)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3);

  return {
    pulse,
    country,
    related: (relRes.data ?? []) as RelatedRow[],
  };
}

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function approximateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function PulseReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getActiveLocale();
  const { pulse, country, related } = await loadPulse(slug, locale);

  if (!pulse) notFound();

  const fallbackUsed = pulse.locale !== locale;
  const html = renderMarkdown(pulse.body_markdown);
  const readingMin = approximateReadingMinutes(pulse.body_markdown);

  return (
    <article className="min-h-screen">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-6 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/pulse" className="hover:text-foreground transition-colors">
              ← Weekly Pulse
            </Link>
          </div>

          {/* Country chip */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-4">
            {country ? (
              <>
                <span className="text-base" aria-hidden="true">
                  {country.flag_emoji ?? '🌐'}
                </span>
                <Link
                  href={`/country/${country.code.toLowerCase()}`}
                  className="hover:text-foreground transition-colors"
                >
                  {country.name}
                </Link>
              </>
            ) : pulse.country_code === 'global' ? (
              <>
                <span className="text-base" aria-hidden="true">🌐</span>
                <span>Global</span>
              </>
            ) : (
              <span>{pulse.country_code}</span>
            )}
            <span aria-hidden="true">·</span>
            <span>Weekly Pulse</span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            {pulse.title}
          </h1>

          {/* Byline */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-muted">
            <time dateTime={pulse.published_at} className="tabular-nums">
              {formatLongDate(pulse.published_at)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{readingMin} min read</span>
            {fallbackUsed && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-foreground-subtle">
                  English edition — not yet translated
                </span>
              </>
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

      {/* ── NEWSLETTER (inline variant) ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <NewsletterCTA variant="inline" />
      </section>

      {/* ── RELATED ── */}
      {related.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-6">
            More from {country?.name ?? (pulse.country_code === 'global' ? 'Global' : pulse.country_code)}
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/pulse/${r.slug}`}
                  className="flex items-center justify-between gap-4 py-4 group hover:bg-background-alt/40 -mx-4 px-4 rounded transition-colors"
                >
                  <span className="font-serif text-lg leading-snug font-medium group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                    {r.title}
                  </span>
                  <time
                    dateTime={r.published_at}
                    className="text-xs text-foreground-subtle tabular-nums shrink-0"
                  >
                    {shortDate(r.published_at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── BACK TO LIST ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
        <Link
          href="/pulse"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground"
        >
          ← All Pulses
        </Link>
      </section>
    </article>
  );
}
