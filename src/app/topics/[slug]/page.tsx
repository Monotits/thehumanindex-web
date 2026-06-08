import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { StressBand } from '@/components/ui/StressBand';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { bandFor, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';
import { TOPIC_CATALOG, getTopicEntry, type TopicEntry } from '@/lib/ui/topic-catalog';
import { getActiveLocale } from '@/lib/ui/locale';
import { PageViewBeacon } from '@/components/PageViewBeacon';
import { ShareButton } from '@/components/ui/ShareButton';

export const dynamic = 'force-dynamic';

interface RelatedIndicator {
  id: string;
  name: string;
  unit: string | null;
  source_org: string | null;
  globalAvg: number | null;
}

interface RankedCountry {
  country_code: string;
  country_name: string;
  flag_emoji: string | null;
  score: number;
}

interface RelatedPulse {
  slug: string;
  title: string;
  country_code: string;
  published_at: string;
}

export async function generateStaticParams() {
  return TOPIC_CATALOG.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getTopicEntry(slug);
  if (!entry) return { title: 'Topic — The Human Index' };
  return {
    title: `${entry.title} | The Human Index`,
    description: entry.description,
    alternates: { canonical: `https://thehumanindex.org/topics/${slug}` },
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: 'article',
    },
  };
}

async function loadTopic(entry: TopicEntry, locale: string) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return {
      indicators: [] as RelatedIndicator[],
      ranking: [] as RankedCountry[],
      pulses: [] as RelatedPulse[],
    };
  }
  const sb = createClient(sbUrl, sbKey);
  const allIndicatorIds = [entry.headlineIndicator, ...entry.relatedIndicators];

  const [indMetaRes, valuesRes, countriesRes, pulsesRes] = await Promise.all([
    sb
      .from('indicators')
      .select('id, name, unit, source_org')
      .in('id', allIndicatorIds),
    sb
      .from('v_country_latest_indicators')
      .select('country_code, indicator_id, normalized_value')
      .in('indicator_id', allIndicatorIds),
    sb.from('countries').select('code, name, flag_emoji').eq('active', true),
    sb
      .from('commentary')
      .select('slug, title, country_code, published_at, body_markdown')
      .eq('type', 'weekly_pulse')
      .eq('locale', locale)
      .order('published_at', { ascending: false })
      .limit(40),
  ]);

  const indMeta = (indMetaRes.data ?? []) as Array<{
    id: string;
    name: string;
    unit: string | null;
    source_org: string | null;
  }>;

  const values = (valuesRes.data ?? []) as Array<{
    country_code: string;
    indicator_id: string;
    normalized_value: number | null;
  }>;

  // Per-indicator global avg + ranking on the headline indicator
  const perIndicator = new Map<string, number[]>();
  const headline = new Map<string, number>(); // country_code → headline score
  for (const r of values) {
    if (r.normalized_value === null) continue;
    if (!perIndicator.has(r.indicator_id)) perIndicator.set(r.indicator_id, []);
    perIndicator.get(r.indicator_id)!.push(r.normalized_value);
    if (r.indicator_id === entry.headlineIndicator) {
      headline.set(r.country_code, r.normalized_value);
    }
  }

  const indicators: RelatedIndicator[] = indMeta.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    source_org: m.source_org,
    globalAvg: (() => {
      const arr = perIndicator.get(m.id);
      if (!arr || arr.length === 0) return null;
      return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
    })(),
  }));
  // Order: headline first, then catalog order
  indicators.sort((a, b) => {
    if (a.id === entry.headlineIndicator) return -1;
    if (b.id === entry.headlineIndicator) return 1;
    return allIndicatorIds.indexOf(a.id) - allIndicatorIds.indexOf(b.id);
  });

  const countryMap = new Map<string, { name: string; flag: string | null }>();
  for (const r of (countriesRes.data ?? []) as Array<{
    code: string;
    name: string;
    flag_emoji: string | null;
  }>) {
    countryMap.set(r.code, { name: r.name, flag: r.flag_emoji });
  }

  const ranking: RankedCountry[] = Array.from(headline.entries())
    .map(([cc, score]) => {
      const c = countryMap.get(cc);
      return {
        country_code: cc,
        country_name: c?.name ?? cc,
        flag_emoji: c?.flag ?? null,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Related Pulse — keyword match on title or body
  const tokens = entry.pulseKeywords
    .map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((k) => k.length > 2);
  const regex = tokens.length > 0 ? new RegExp(tokens.join('|'), 'i') : null;

  const pulseRows = (pulsesRes.data ?? []) as Array<{
    slug: string;
    title: string;
    country_code: string;
    published_at: string;
    body_markdown: string | null;
  }>;
  const pulses: RelatedPulse[] = regex
    ? pulseRows
        .filter((p) => regex.test(p.title) || (p.body_markdown && regex.test(p.body_markdown)))
        .slice(0, 6)
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          country_code: p.country_code,
          published_at: p.published_at,
        }))
    : [];

  return { indicators, ranking, pulses };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getTopicEntry(slug);
  if (!entry) notFound();

  const locale = await getActiveLocale();
  const { indicators, ranking, pulses } = await loadTopic(entry, locale);

  return (
    <article className="min-h-screen">
      <PageViewBeacon
        event="topic_viewed"
        properties={{ slug: entry.slug, meta_index: entry.meta }}
      />
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/topics" className="hover:text-foreground transition-colors">
              ← Topics
            </Link>
            <span aria-hidden="true">·</span>
            <MetaCategoryBadge meta={entry.meta} variant="dot" size="sm" />
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-start gap-4">
              <span className="text-5xl" aria-hidden="true">
                {entry.emoji}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
                {entry.title}
              </h1>
            </div>
            <ShareButton
              url={`/topics/${entry.slug}`}
              title={entry.title}
              text={entry.subhead}
              surface="topic_hub"
              variant="full"
            />
          </div>
          <p className="mt-3 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl leading-relaxed">
            {entry.subhead}
          </p>
        </div>
      </header>

      {/* ── HEADLINE RANKING ── */}
      {ranking.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
            The 10 most affected countries
          </h2>
          <p className="text-foreground-muted max-w-2xl mb-8">
            Ranked by the headline indicator for this topic. Click any country
            for the full breakdown.
          </p>

          <ol className="divide-y divide-border border-y border-border max-w-3xl">
            {ranking.map((r) => {
              const b = bandFor(r.score);
              return (
                <li key={r.country_code} className="py-4">
                  <Link
                    href={`/country/${r.country_code.toLowerCase()}`}
                    className="flex items-center gap-3 sm:gap-4 group hover:bg-background-alt/40 -mx-4 px-4 rounded transition-colors"
                  >
                    <span className="font-mono tabular-nums text-2xl font-semibold text-foreground-muted w-9 text-right">
                      {ranking.indexOf(r) + 1}
                    </span>
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {r.flag_emoji ?? '🏳️'}
                    </span>
                    <span className="flex-1 font-serif text-lg sm:text-xl font-semibold group-hover:underline decoration-foreground-subtle/40 underline-offset-2 truncate">
                      {r.country_name}
                    </span>
                    <span
                      className="font-mono tabular-nums text-xl sm:text-2xl font-semibold"
                      style={{ color: b ? `var(--band-${b})` : undefined }}
                    >
                      {r.score.toFixed(1)}
                    </span>
                    {b && (
                      <StressBand band={b} score={null} showScore={false} variant="pill" size="sm" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ── INDICATORS USED ── */}
      {indicators.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
            The signals we measure
          </h2>
          <p className="text-foreground-muted max-w-2xl mb-8">
            {indicators.length === 1
              ? 'The indicator behind this topic.'
              : `${indicators.length} indicators feed this topic — the headline first, plus related signals.`}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((ind, i) => {
              const b = bandFor(ind.globalAvg);
              const isHeadline = i === 0;
              return (
                <li key={ind.id}>
                  <Link
                    href={`/indicator/${ind.id}`}
                    className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-5 transition-colors h-full"
                  >
                    {isHeadline && (
                      <div className="text-[10px] uppercase tracking-wider text-foreground-subtle font-medium mb-2">
                        Headline indicator
                      </div>
                    )}
                    <h3 className="font-serif text-lg font-semibold leading-snug mb-2 group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                      {ind.name}
                    </h3>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span
                        className="font-mono tabular-nums text-2xl font-semibold"
                        style={{ color: b ? `var(--band-${b})` : undefined }}
                      >
                        {ind.globalAvg !== null ? ind.globalAvg.toFixed(1) : '—'}
                      </span>
                      <span className="text-xs text-foreground-subtle uppercase tracking-wide">
                        global avg
                      </span>
                    </div>
                    {ind.source_org && (
                      <div className="text-[11px] text-foreground-subtle">
                        Source: {ind.source_org}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── RELATED PULSE ── */}
      {pulses.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
              Recent analysis
            </h2>
            <Link
              href="/pulse"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              All Pulses →
            </Link>
          </div>
          <ul className="grid sm:grid-cols-2 gap-5">
            {pulses.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/pulse/${p.slug}`}
                  className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-5 transition-colors h-full"
                >
                  <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-2">
                    {p.country_code === 'global' ? 'Global' : p.country_code}
                    {' · '}
                    {new Date(p.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <h3 className="font-serif text-lg font-semibold leading-snug group-hover:underline decoration-foreground-subtle/40 underline-offset-2 text-balance">
                    {p.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── OTHER TOPICS ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-serif text-xl font-semibold mb-5">Other topics</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TOPIC_CATALOG.filter((t) => t.slug !== entry.slug).map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/topics/${t.slug}`}
                  className="group flex items-center gap-2 rounded-lg border border-border bg-background hover:bg-background-alt/60 px-3 py-2 transition-colors h-full"
                >
                  <span className="text-lg" aria-hidden="true">{t.emoji}</span>
                  <span className="text-sm font-medium group-hover:underline decoration-foreground-subtle/40 underline-offset-2 truncate">
                    {t.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Suppress unused (kept for future Turkish topic labels) */}
      {void META_LABELS as unknown as null}
    </article>
  );
}
