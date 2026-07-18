import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { StressBand } from '@/components/ui/StressBand';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { SparklineMini } from '@/components/ui/SparklineMini';
import { bandFor, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';
import { TOP_10_CATALOG, getTop10Entry, type Top10Entry } from '@/lib/ui/top10-catalog';
import { loadCompositeHistory, pointsToDenseSeries } from '@/lib/ui/history';
import { PageViewBeacon } from '@/components/PageViewBeacon';
import { ShareButton } from '@/components/ui/ShareButton';
import { ItemListJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';

export const revalidate = 3600;

interface Ranked {
  country_code: string;
  country_name: string;
  flag_emoji: string | null;
  rank: number;
  score: number | null;
  rawValue?: number | null;
  history?: Array<number | null>;
}

export async function generateStaticParams() {
  return TOP_10_CATALOG.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getTop10Entry(slug);
  if (!entry) return { title: 'Ranking — The Human Index' };
  return {
    title: `${entry.title} | The Human Index`,
    description: entry.description,
    alternates: { canonical: `https://thehumanindex.org/top-10/${slug}` },
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: 'article',
    },
  };
}

async function loadRanking(entry: Top10Entry): Promise<Ranked[]> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];

  const sb = createClient(sbUrl, sbKey);

  // 1. Country names (always needed)
  const countriesRes = await sb
    .from('countries')
    .select('code, name, flag_emoji')
    .eq('active', true);
  const countryMap = new Map(
    (countriesRes.data ?? []).map((r) => [
      (r as { code: string }).code,
      r as { code: string; name: string; flag_emoji: string | null },
    ]),
  );

  // 2. Score lookup depends on the source kind
  let rows: Array<{ country_code: string; score: number | null; raw?: number | null }> = [];

  if (entry.source.kind === 'composite') {
    const res = await sb
      .from('v_country_latest_composite')
      .select('country_code, score_value');
    rows = ((res.data ?? []) as Array<{ country_code: string; score_value: number }>)
      .map((r) => ({ country_code: r.country_code, score: r.score_value }));
  } else if (entry.source.kind === 'meta') {
    const meta = entry.source.meta_index;
    const res = await sb
      .from('v_country_latest_meta_indexes')
      .select('country_code, meta_index, value')
      .eq('meta_index', meta);
    rows = ((res.data ?? []) as Array<{
      country_code: string;
      meta_index: MetaIndex;
      value: number | null;
    }>)
      .filter((r) => r.value !== null)
      .map((r) => ({ country_code: r.country_code, score: r.value }));
  } else {
    // indicator
    const id = entry.source.indicator_id;
    const res = await sb
      .from('v_country_latest_indicators')
      .select('country_code, raw_value, normalized_value')
      .eq('indicator_id', id);
    rows = ((res.data ?? []) as Array<{
      country_code: string;
      raw_value: number | null;
      normalized_value: number | null;
    }>)
      .filter((r) => r.normalized_value !== null)
      .map((r) => ({
        country_code: r.country_code,
        score: r.normalized_value,
        raw: r.raw_value,
      }));
  }

  // Sort and slice
  rows.sort((a, b) => {
    const av = a.score ?? -Infinity;
    const bv = b.score ?? -Infinity;
    return entry.direction === 'most' ? bv - av : av - bv;
  });
  const limit = entry.limit ?? 10;
  const top = rows.slice(0, limit);

  // 3. For composite rankings, attach a 60-day sparkline
  let historyMap = new Map<string, ReturnType<typeof pointsToDenseSeries>>();
  if (entry.source.kind === 'composite') {
    const map = await loadCompositeHistory(
      top.map((r) => r.country_code),
      60,
    );
    historyMap = new Map(
      Array.from(map.entries()).map(([cc, points]) => [
        cc,
        pointsToDenseSeries(points, 60),
      ]),
    );
  }

  return top.map((r, i) => {
    const c = countryMap.get(r.country_code);
    return {
      country_code: r.country_code,
      country_name: c?.name ?? r.country_code,
      flag_emoji: c?.flag_emoji ?? null,
      rank: i + 1,
      score: r.score,
      rawValue: r.raw,
      history: historyMap.get(r.country_code),
    };
  });
}

export default async function Top10Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getTop10Entry(slug);
  if (!entry) notFound();

  const ranked = await loadRanking(entry);

  const lensLabel =
    entry.source.kind === 'composite'
      ? 'composite stress score'
      : entry.source.kind === 'meta'
        ? `${META_LABELS[entry.source.meta_index]} meta-index`
        : 'indicator value';

  const pageUrl = `https://thehumanindex.org/top-10/${entry.slug}`;

  return (
    <article className="min-h-screen">
      <ItemListJsonLd
        name={entry.title}
        url={pageUrl}
        items={ranked.map((r) => ({
          name: r.country_name,
          url: `https://thehumanindex.org/country/${r.country_code.toLowerCase()}`,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://thehumanindex.org' },
          { name: 'Top 10', url: 'https://thehumanindex.org/top-10' },
          { name: entry.title, url: pageUrl },
        ]}
      />
      <PageViewBeacon
        event="top_10_viewed"
        properties={{
          slug: entry.slug,
          source_kind: entry.source.kind,
          direction: entry.direction,
        }}
      />
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/countries" className="hover:text-foreground transition-colors">
              ← Rankings
            </Link>
            {entry.source.kind === 'meta' && (
              <>
                <span aria-hidden="true">·</span>
                <MetaCategoryBadge meta={entry.source.meta_index} variant="dot" size="sm" />
              </>
            )}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              {entry.title}
            </h1>
            <ShareButton
              url={`/top-10/${entry.slug}`}
              title={entry.title}
              text={entry.subhead}
              surface="top10_ranking"
              variant="full"
            />
          </div>
          <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl leading-relaxed">
            {entry.subhead}
          </p>
        </div>
      </header>

      {/* ── RANKING ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {ranked.length === 0 ? (
          <p className="text-foreground-muted">
            No data available for this ranking right now.
          </p>
        ) : (
          <ol className="divide-y divide-border border-y border-border max-w-3xl">
            {ranked.map((r) => {
              const b = bandFor(r.score);
              return (
                <li key={r.country_code} className="py-4">
                  <Link
                    href={`/country/${r.country_code.toLowerCase()}`}
                    className="flex items-center gap-3 sm:gap-4 group hover:bg-background-alt/40 -mx-4 px-4 rounded transition-colors"
                  >
                    <span className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-foreground-muted w-10 text-right">
                      {r.rank}
                    </span>
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {r.flag_emoji ?? '🏳️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg sm:text-xl font-semibold leading-snug group-hover:underline decoration-foreground-subtle/40 underline-offset-2 truncate">
                        {r.country_name}
                      </h3>
                      <div className="text-xs text-foreground-subtle uppercase tracking-wide mt-0.5">
                        {lensLabel}
                      </div>
                    </div>
                    {r.history && r.history.filter((v) => v !== null).length >= 2 && (
                      <SparklineMini
                        data={r.history}
                        width={80}
                        height={24}
                        stroke="var(--foreground-subtle)"
                        className="hidden sm:inline-block"
                      />
                    )}
                    <div className="text-right shrink-0">
                      {r.rawValue !== undefined && r.rawValue !== null && (
                        <div className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                          Raw
                        </div>
                      )}
                      {r.rawValue !== undefined && r.rawValue !== null && (
                        <div className="text-xs text-foreground-muted font-mono tabular-nums">
                          {r.rawValue.toFixed(1)}
                        </div>
                      )}
                      <div
                        className="font-mono tabular-nums text-xl sm:text-2xl font-semibold mt-1"
                        style={{ color: b ? `var(--band-${b})` : undefined }}
                      >
                        {r.score !== null ? r.score.toFixed(1) : '—'}
                      </div>
                      {b && (
                        <StressBand band={b} score={null} showScore={false} variant="pill" size="sm" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── EDITORIAL ── */}
      {entry.editorial && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
            What this measures
          </h2>
          <p className="text-base text-foreground-muted leading-relaxed">
            {entry.editorial}
          </p>
        </section>
      )}

      {/* ── RELATED RANKINGS ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-6">
          Other rankings
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOP_10_CATALOG.filter((e) => e.slug !== entry.slug)
            .slice(0, 6)
            .map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/top-10/${e.slug}`}
                  className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-4 transition-colors"
                >
                  <h3 className="font-serif text-base font-semibold leading-snug group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                    {e.title}
                  </h3>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      {/* ── TRUST FOOTER ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-foreground-muted max-w-md">
            The pipeline re-checks every 12 hours; underlying sources publish on their own cadence.
            Every number traces back to its source on the country page.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/methodology"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Methodology
            </Link>
            <Link
              href="/transparency"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Transparency
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
