import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { renderMarkdown } from '@/lib/ui/markdown';
import { getActiveLocale } from '@/lib/ui/locale';
import { NewsletterCTA } from '@/components/ui/NewsletterCTA';
import { bandFor, BAND_LABELS } from '@/lib/ui/tokens';

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

  // Live composite score for this Pulse's country — used to surface drift
  // between the score quoted in the article (a snapshot at publish time) and
  // the current ranking. Skip for 'global' Pulses which don't have a single
  // composite to compare against.
  let liveComposite: number | null = null;
  if (pulse.country_code && pulse.country_code !== 'global') {
    try {
      const liveRes = await sb
        .from('v_country_latest_composite')
        .select('score_value')
        .eq('country_code', pulse.country_code)
        .maybeSingle();
      const v = (liveRes.data as { score_value: number } | null)?.score_value;
      liveComposite = typeof v === 'number' ? v : null;
    } catch {
      liveComposite = null;
    }
  }

  return {
    pulse,
    country,
    related: (relRes.data ?? []) as RelatedRow[],
    liveComposite,
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
  const { pulse, country, related, liveComposite } = await loadPulse(slug, locale);

  if (!pulse) notFound();

  const fallbackUsed = pulse.locale !== locale;
  const html = renderMarkdown(pulse.body_markdown);
  const readingMin = approximateReadingMinutes(pulse.body_markdown);
  const liveBand = bandFor(liveComposite);
  const liveBandLabel = liveBand ? BAND_LABELS[liveBand] : null;
  const showLiveStrip = country != null && liveComposite != null && liveBand != null;

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
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Snapshot drift note — every Pulse quotes the composite at publish
            time, but the underlying pipeline keeps moving. Surface the
            current live score so readers can never be misled by editorial
            sticking to a stale number. */}
        {showLiveStrip && (
          <aside
            className="mb-8 rounded-lg border border-border bg-background-alt/40 px-4 py-3 text-sm text-foreground-muted flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2"
            aria-label="Live composite drift"
          >
            <div>
              <strong className="text-foreground font-medium">
                This Pulse reflects {country?.name ?? 'the country'}&apos;s reading on{' '}
                {shortDate(pulse.published_at)}.
              </strong>{' '}
              The pipeline keeps moving — current composite is shown on the right.
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-xs uppercase tracking-wider text-foreground-subtle">
                Live now
              </span>
              <span
                className="font-mono tabular-nums text-lg font-semibold"
                style={{ color: liveBand ? `var(--band-${liveBand})` : undefined }}
              >
                {liveComposite!.toFixed(1)}
              </span>
              <span className="text-xs text-foreground-muted">
                {liveBandLabel}
              </span>
              {country && (
                <Link
                  href={`/country/${country.code.toLowerCase()}`}
                  className="text-xs underline underline-offset-2 decoration-foreground-subtle/40 hover:text-foreground ml-1"
                >
                  country page →
                </Link>
              )}
            </div>
          </aside>
        )}
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
