import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { StressBand } from '@/components/ui/StressBand';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { SourceAttribution } from '@/components/ui/SourceAttribution';
import { SparklineMini } from '@/components/ui/SparklineMini';
import { CompositeLineChart, type CompositePoint } from '@/components/ui/CompositeLineChart';
import { cn } from '@/lib/ui/cn';
import { loadCompositeHistory, pointsToDenseSeries, trendSummary, type CompositeHistoryPoint } from '@/lib/ui/history';
import {
  bandFor,
  freshnessFor,
  META_INDEXES,
  META_LABELS,
  META_WEIGHT,
  type MetaIndex,
} from '@/lib/ui/tokens';
import { getActiveLocale } from '@/lib/ui/locale';

export const dynamic = 'force-dynamic';

// ── Types ──────────────────────────────────────────────────────────

interface CountryRow {
  code: string;
  name: string;
  region: string | null;
  flag_emoji: string | null;
}

interface IndicatorRow {
  id: string;
  meta_index: MetaIndex;
  name: string;
  description: string | null;
  source_org: string | null;
  source_url: string | null;
  unit: string | null;
  display_order: number;
}

interface IndicatorValueRow {
  country_code: string;
  indicator_id: string;
  raw_value: number | null;
  normalized_value: number | null;
  reference_date: string;
}

interface PulsePreview {
  slug: string;
  title: string;
  body_markdown: string | null;
  published_at: string;
}

interface CountryDetailData {
  country: CountryRow | null;
  composite: number | null;
  computedAt: string | null;
  metaValues: Partial<Record<MetaIndex, number>>;
  indicators: IndicatorRow[];
  indicatorValues: Map<string, IndicatorValueRow>;
  latestPulse: PulsePreview | null;
  pulseFallbackUsed: boolean;
  compositeHistory: Array<number | null>;
  compositeHistoryPoints: CompositePoint[];
}

// ── Data loaders ───────────────────────────────────────────────────

async function loadCountryDetail(
  code: string,
  locale: string,
): Promise<CountryDetailData> {
  const empty: CountryDetailData = {
    country: null,
    composite: null,
    computedAt: null,
    metaValues: {},
    indicators: [],
    indicatorValues: new Map(),
    latestPulse: null,
    pulseFallbackUsed: false,
    compositeHistory: [],
    compositeHistoryPoints: [],
  };

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return empty;

  const sb = createClient(sbUrl, sbKey);
  const upper = code.toUpperCase();

  const [
    countryRes,
    compositeRes,
    metaRes,
    indicatorsRes,
    indicatorValuesRes,
  ] = await Promise.all([
    sb
      .from('countries')
      .select('code, name, region, flag_emoji')
      .eq('code', upper)
      .eq('active', true)
      .maybeSingle(),
    sb
      .from('v_country_latest_composite')
      .select('country_code, score_value, computed_at')
      .eq('country_code', upper)
      .maybeSingle(),
    sb
      .from('v_country_latest_meta_indexes')
      .select('country_code, meta_index, value')
      .eq('country_code', upper),
    sb
      .from('indicators')
      .select('id, meta_index, name, description, source_org, source_url, unit, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    sb
      .from('v_country_latest_indicators')
      .select('country_code, indicator_id, raw_value, normalized_value, reference_date')
      .eq('country_code', upper),
  ]);

  const country = countryRes.data as CountryRow | null;
  if (!country) return empty;

  const composite = (compositeRes.data as { score_value: number } | null)?.score_value ?? null;
  const computedAt = (compositeRes.data as { computed_at: string } | null)?.computed_at ?? null;

  const metaValues: Partial<Record<MetaIndex, number>> = {};
  for (const row of (metaRes.data ?? []) as Array<{ meta_index: MetaIndex; value: number | null }>) {
    if (row.value !== null) metaValues[row.meta_index] = row.value;
  }

  const indicators = (indicatorsRes.data ?? []) as IndicatorRow[];
  const indicatorValues = new Map<string, IndicatorValueRow>();
  for (const row of (indicatorValuesRes.data ?? []) as IndicatorValueRow[]) {
    indicatorValues.set(row.indicator_id, row);
  }

  // Latest Pulse for this country (locale-aware)
  let pulseRes = await sb
    .from('commentary')
    .select('slug, title, body_markdown, published_at')
    .eq('type', 'weekly_pulse')
    .eq('country_code', upper)
    .eq('locale', locale)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let pulseFallbackUsed = false;
  if (!pulseRes.data && locale !== 'en') {
    pulseFallbackUsed = true;
    pulseRes = await sb
      .from('commentary')
      .select('slug, title, body_markdown, published_at')
      .eq('type', 'weekly_pulse')
      .eq('country_code', upper)
      .eq('locale', 'en')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  // Composite history (last 90 days) — used for both the hero sparkline
  // (dense series for SparklineMini) and the full line chart (sparse
  // point list with real dates for tooltip).
  const historyMap = await loadCompositeHistory([upper], 90);
  const rawPoints: CompositeHistoryPoint[] = historyMap.get(upper) ?? [];
  const compositeHistory = pointsToDenseSeries(rawPoints, 90);
  const compositeHistoryPoints: CompositePoint[] = rawPoints.map((p) => ({
    date: p.date,
    value: p.value,
  }));

  return {
    country,
    composite,
    computedAt,
    metaValues,
    indicators,
    indicatorValues,
    latestPulse: (pulseRes.data as PulsePreview | null) ?? null,
    pulseFallbackUsed,
    compositeHistory,
    compositeHistoryPoints,
  };
}

// ── Metadata ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const upper = code.toUpperCase();

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let name = upper;

  if (sbUrl && sbKey) {
    const sb = createClient(sbUrl, sbKey);
    const res = await sb
      .from('countries')
      .select('name')
      .eq('code', upper)
      .maybeSingle();
    if (res.data) name = (res.data as { name: string }).name;
  }

  return {
    title: `${name} — The Human Index`,
    description: `Civilizational stress composite, 5-meta-index breakdown, and 31-indicator detail for ${name}. Every number sourced.`,
    alternates: {
      canonical: `https://thehumanindex.org/country/${upper.toLowerCase()}`,
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function makeExcerpt(body: string | null | undefined, maxLen = 280): string {
  if (!body) return '';
  const stripped = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen - 3).trimEnd() + '…';
}

function formatNumber(value: number | null, unit: string | null): string {
  if (value === null || value === undefined) return '—';
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

// ── Page ───────────────────────────────────────────────────────────

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getActiveLocale();
  const data = await loadCountryDetail(code, locale);

  if (!data.country) notFound();

  const {
    country, composite, computedAt, metaValues, indicators, indicatorValues,
    latestPulse, pulseFallbackUsed, compositeHistory, compositeHistoryPoints,
  } = data;
  const band = bandFor(composite);
  const trend = trendSummary(compositeHistory);

  // Group indicators by meta-index
  const byMeta = new Map<MetaIndex, IndicatorRow[]>();
  for (const m of META_INDEXES) byMeta.set(m, []);
  for (const ind of indicators) {
    if (!byMeta.has(ind.meta_index)) byMeta.set(ind.meta_index, []);
    byMeta.get(ind.meta_index)!.push(ind);
  }

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start gap-4 mb-2 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/countries" className="hover:text-foreground transition-colors">
              ← All countries
            </Link>
            {country.region && (
              <>
                <span aria-hidden="true">·</span>
                <span>{country.region}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4 mt-6">
            <span className="text-5xl sm:text-6xl" aria-hidden="true">
              {country.flag_emoji ?? '🏳️'}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-none tracking-tight">
              {country.name}
            </h1>
          </div>

          {composite !== null && (
            <div className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                  Composite stress
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-mono tabular-nums text-5xl sm:text-6xl font-semibold">
                    {composite.toFixed(1)}
                  </span>
                  {band && (
                    <StressBand band={band} score={null} showScore={false} variant="pill" size="lg" />
                  )}
                  {/* 90-day trend mini chart */}
                  {compositeHistory.filter((v) => v !== null).length >= 2 && (
                    <span className="inline-flex items-center gap-2 ml-1">
                      <SparklineMini
                        data={compositeHistory}
                        width={120}
                        height={36}
                        filled
                        showEndPoint
                        stroke={
                          trend.direction === 'up'
                            ? 'var(--band-high)'
                            : trend.direction === 'down'
                              ? 'var(--band-low)'
                              : 'var(--foreground-subtle)'
                        }
                        ariaLabel="90-day composite trend"
                      />
                      <span
                        className="text-xs font-mono tabular-nums"
                        style={{
                          color:
                            trend.direction === 'up'
                              ? 'var(--band-high)'
                              : trend.direction === 'down'
                                ? 'var(--band-low)'
                                : 'var(--foreground-subtle)',
                        }}
                      >
                        {trend.direction === 'up' && '▲'}
                        {trend.direction === 'down' && '▼'}
                        {trend.direction === 'flat' && '◆'}{' '}
                        {trend.delta > 0 ? '+' : ''}
                        {trend.delta.toFixed(1)}
                      </span>
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-foreground-subtle">
                  90-day trend{trend.direction !== 'flat'
                    ? ` · ${trend.direction === 'up' ? 'stress rising' : 'stress easing'}`
                    : ''}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                  Last updated
                </div>
                <div className="text-base sm:text-lg text-foreground-muted">
                  {formatRelative(computedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── COMPOSITE LINE CHART ── */}
      {compositeHistoryPoints.length >= 2 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
              Composite trend, 90 days
            </h2>
            <p className="text-foreground-muted">
              Daily-bucketed composite stress score. Dashed gridlines mark
              the band thresholds (25 / 45 / 65 / 80) — crossing one signals
              a category change.
            </p>
          </div>
          <CompositeLineChart data={compositeHistoryPoints} height={300} />
        </section>
      )}

      {/* ── 5 META CARDS ── */}
      <section className={cn(
        "max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10",
        compositeHistoryPoints.length >= 2 && "border-t border-border"
      )}>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Stress by domain
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          Five weighted meta-indexes. Together they constitute the composite.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {META_INDEXES.map((m) => {
            const v = metaValues[m] ?? null;
            const b = bandFor(v);
            return (
              <div key={m} className="rounded-lg border border-border bg-background p-4">
                <MetaCategoryBadge meta={m} variant="dot" size="sm" />
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-3xl font-semibold">
                    {v !== null ? v.toFixed(1) : '—'}
                  </span>
                  {b && (
                    <span
                      className="text-xs font-medium"
                      style={{ color: `var(--band-${b})` }}
                    >
                      {b}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-foreground-subtle tabular-nums">
                  weight {Math.round(META_WEIGHT[m] * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LATEST PULSE FOR COUNTRY ── */}
      {latestPulse && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
              Latest Pulse
            </h2>
            <Link
              href="/pulse"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              All Pulses →
            </Link>
          </div>
          <Link
            href={`/pulse/${latestPulse.slug}`}
            className="group block rounded-lg border border-border bg-background-alt/30 hover:bg-background-alt p-7 transition-colors max-w-3xl"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-3">
              <time dateTime={latestPulse.published_at} className="tabular-nums">
                {new Date(latestPulse.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </div>
            <h3 className="font-serif text-2xl font-semibold leading-snug mb-3 text-balance group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
              {latestPulse.title}
            </h3>
            <p className="text-foreground-muted text-base line-clamp-3 text-pretty">
              {makeExcerpt(latestPulse.body_markdown)}
            </p>
          </Link>
        </section>
      )}

      {/* ── INDICATOR BREAKDOWN ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Indicators in detail
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-10">
          The raw measurements feeding into each meta-index, grouped by domain.
          Click any indicator to read the underlying source.
        </p>

        <div className="space-y-12">
          {META_INDEXES.map((m) => {
            const list = byMeta.get(m) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={m}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <MetaCategoryBadge meta={m} variant="dot" size="md" />
                    <span className="text-xs uppercase tracking-wider text-foreground-subtle">
                      {list.length} indicator{list.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {metaValues[m] !== undefined && (
                    <div className="flex items-baseline gap-2 text-foreground-muted">
                      <span>{META_LABELS[m]} avg</span>
                      <span className="font-mono tabular-nums text-base font-semibold text-foreground">
                        {metaValues[m]!.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <ul className="divide-y divide-border border-y border-border">
                  {list.map((ind) => (
                    <IndicatorRowItem
                      key={ind.id}
                      indicator={ind}
                      value={indicatorValues.get(ind.id) ?? null}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TRUST FOOTER ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-foreground-muted max-w-xl">
            Every number on this page can be traced back to its source. See{' '}
            <Link
              href={`/api/transparency/${country.code.toLowerCase()}`}
              className="underline underline-offset-2 decoration-foreground-subtle/40 hover:text-foreground"
            >
              full sourcing audit
            </Link>{' '}
            for raw values, divergence history, and source comparison.
          </p>
          <Link
            href="/methodology"
            className="text-sm text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
          >
            How composites are computed →
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Indicator row ──────────────────────────────────────────────────

function IndicatorRowItem({
  indicator,
  value,
}: {
  indicator: IndicatorRow;
  value: IndicatorValueRow | null;
}) {
  const normalized = value?.normalized_value ?? null;
  const band = bandFor(normalized);
  const freshness = freshnessFor(value?.reference_date ?? null);

  return (
    <li className="py-4 flex items-start gap-4 flex-wrap sm:flex-nowrap">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-medium leading-snug">
          {indicator.name}
        </h4>
        {indicator.description && (
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 line-clamp-2">
            {indicator.description}
          </p>
        )}
        {indicator.source_org && (
          <div className="mt-2">
            <SourceAttribution
              source={indicator.source_org}
              href={indicator.source_url ?? undefined}
              referenceDate={value?.reference_date ?? null}
              freshness={freshness}
              variant="inline"
            />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-3 sm:gap-4 sm:ml-auto sm:text-right shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-subtle">
            Raw
          </div>
          <div className="font-mono tabular-nums text-sm text-foreground-muted whitespace-nowrap">
            {formatNumber(value?.raw_value ?? null, indicator.unit)}
          </div>
        </div>
        <div className="border-l border-border h-8 self-center" aria-hidden="true" />
        <div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-subtle">
            Stress
          </div>
          <div
            className="font-mono tabular-nums text-base font-semibold whitespace-nowrap"
            style={{ color: band ? `var(--band-${band})` : undefined }}
          >
            {normalized !== null ? normalized.toFixed(0) : '—'}
          </div>
        </div>
      </div>
    </li>
  );
}
