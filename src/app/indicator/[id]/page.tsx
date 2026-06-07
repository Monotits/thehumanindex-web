import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { SourceAttribution } from '@/components/ui/SourceAttribution';
import { CompositeLineChart, type CompositePoint } from '@/components/ui/CompositeLineChart';
import { PageViewBeacon } from '@/components/PageViewBeacon';
import { bandFor, freshnessFor, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';

export const revalidate = 3600;

interface IndicatorRow {
  id: string;
  meta_index: MetaIndex;
  name: string;
  description: string | null;
  source_org: string | null;
  source_url: string | null;
  unit: string | null;
  normalize_invert: boolean;
  weight_within_meta: number;
}

interface CountryValueRow {
  country_code: string;
  country_name: string;
  flag_emoji: string | null;
  raw_value: number | null;
  normalized_value: number | null;
  reference_date: string;
}

interface IndicatorSnapshotRow {
  snapshot_date: string;
  raw_value: number;
  normalized_value: number | null;
  country_code: string;
}

interface PulsePreview {
  slug: string;
  title: string;
  country_code: string;
  published_at: string;
}

// ── Static params (prerender all 31 indicators) ────────────────────

export async function generateStaticParams() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];
  const sb = createClient(sbUrl, sbKey);
  const res = await sb.from('indicators').select('id').eq('active', true);
  return ((res.data ?? []) as Array<{ id: string }>).map((r) => ({ id: r.id }));
}

// ── Per-indicator metadata (SEO-critical) ──────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return { title: 'Indicator — The Human Index' };

  const sb = createClient(sbUrl, sbKey);
  const res = await sb
    .from('indicators')
    .select('name, description, source_org, meta_index')
    .eq('id', id)
    .maybeSingle();
  const data = res.data as
    | { name: string; description: string | null; source_org: string | null; meta_index: string }
    | null;
  if (!data) return { title: 'Indicator — The Human Index' };

  const title = `${data.name} by country | The Human Index`;
  const description =
    data.description ??
    `Live ranking of ${data.name.toLowerCase()} across 25 tracked countries. ${data.source_org ? `Sourced from ${data.source_org}.` : ''} Re-checked every 12 hours; source publishes on its own cadence.`;

  return {
    title,
    description,
    alternates: { canonical: `https://thehumanindex.org/indicator/${id}` },
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
}

// ── Loader ─────────────────────────────────────────────────────────

async function loadIndicator(id: string) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return { indicator: null, values: [] as CountryValueRow[], trend: [] as CompositePoint[], related: [] as PulsePreview[] };
  }

  const sb = createClient(sbUrl, sbKey);

  // 1. Indicator metadata
  const indicatorRes = await sb
    .from('indicators')
    .select('id, meta_index, name, description, source_org, source_url, unit, normalize_invert, weight_within_meta')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();
  const indicator = indicatorRes.data as IndicatorRow | null;
  if (!indicator) return { indicator: null, values: [] as CountryValueRow[], trend: [] as CompositePoint[], related: [] as PulsePreview[] };

  // 2. Latest value per country
  const valuesRes = await sb
    .from('v_country_latest_indicators')
    .select('country_code, raw_value, normalized_value, reference_date')
    .eq('indicator_id', id);
  const rawValues = (valuesRes.data ?? []) as Array<{
    country_code: string;
    raw_value: number | null;
    normalized_value: number | null;
    reference_date: string;
  }>;

  // 3. Country names + flags
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

  const values: CountryValueRow[] = rawValues
    .map((r) => {
      const c = countryMap.get(r.country_code);
      return {
        country_code: r.country_code,
        country_name: c?.name ?? r.country_code,
        flag_emoji: c?.flag_emoji ?? null,
        raw_value: r.raw_value,
        normalized_value: r.normalized_value,
        reference_date: r.reference_date,
      };
    })
    .filter((r) => r.normalized_value !== null)
    .sort((a, b) => (b.normalized_value ?? 0) - (a.normalized_value ?? 0));

  // 4. Trend: average normalized value across all tracked countries over time.
  //    Pull last 365 days of snapshots for this indicator, bucket by day,
  //    take mean across countries per day.
  const snapshotsRes = await sb
    .from('indicator_snapshots')
    .select('snapshot_date, normalized_value, country_code')
    .eq('indicator_id', id)
    .gte('snapshot_date', new Date(Date.now() - 365 * 86400 * 1000).toISOString().slice(0, 10))
    .order('snapshot_date', { ascending: true });
  const snapshots = (snapshotsRes.data ?? []) as IndicatorSnapshotRow[];

  // Aggregate by day (mean of available countries)
  const byDate = new Map<string, number[]>();
  for (const s of snapshots) {
    if (s.normalized_value === null) continue;
    if (!byDate.has(s.snapshot_date)) byDate.set(s.snapshot_date, []);
    byDate.get(s.snapshot_date)!.push(s.normalized_value);
  }
  const trend: CompositePoint[] = Array.from(byDate.keys())
    .sort()
    .map((d) => {
      const arr = byDate.get(d)!;
      const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
      return { date: d, value: Math.round(mean * 10) / 10 };
    });

  // 5. Related Pulse articles — search bodies for the indicator id or its name.
  //    Simple: pull latest 30 weekly pulses and filter client-side by name match.
  //    (Postgres full-text would be cleaner; this is a pragmatic v1.)
  //
  //    Build the regex defensively: indicator names can contain regex special
  //    characters (e.g. "Government Debt (% of GDP)") and we must not let
  //    those leak into the regex source — that was a hard-fail build error.
  //    Strip everything except a-z0-9 from each candidate word, drop short
  //    stopwords, drop empties.
  const pulsesRes = await sb
    .from('commentary')
    .select('slug, title, country_code, published_at, body_markdown')
    .eq('type', 'weekly_pulse')
    .eq('locale', 'en')
    .order('published_at', { ascending: false })
    .limit(30);

  const STOPWORDS = new Set([
    'and', 'the', 'with', 'from', 'into', 'over', 'rate', 'index', 'per',
  ]);
  const words = indicator.name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const idSafe = indicator.id.replace(/[^a-z0-9]/gi, '');
  const tokens = words.length > 0 ? words : idSafe ? [idSafe] : [];

  let related: PulsePreview[] = [];
  if (tokens.length > 0) {
    const nameRegex = new RegExp(tokens.join('|'), 'i');
    related = (
      (pulsesRes.data ?? []) as Array<{
        slug: string;
        title: string;
        country_code: string;
        published_at: string;
        body_markdown: string | null;
      }>
    )
      .filter((p) => nameRegex.test(p.title) || (p.body_markdown && nameRegex.test(p.body_markdown)))
      .slice(0, 4)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        country_code: p.country_code,
        published_at: p.published_at,
      }));
  }

  return { indicator, values, trend, related };
}

// ── Helpers ────────────────────────────────────────────────────────

function formatRaw(v: number | null, unit: string | null): string {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const formatted = v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

// ── Page ───────────────────────────────────────────────────────────

export default async function IndicatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { indicator, values, trend, related } = await loadIndicator(id);

  if (!indicator) notFound();

  const meanStress =
    values.length > 0
      ? Math.round(
          (values.reduce((s, v) => s + (v.normalized_value ?? 0), 0) / values.length) * 10,
        ) / 10
      : null;
  const top5 = values.slice(0, 5);
  const bottom5 = values.slice(-5).reverse();
  const directionLabel = indicator.normalize_invert
    ? 'Higher raw value = less stress'
    : 'Higher raw value = more stress';

  return (
    <article className="min-h-screen">
      <PageViewBeacon
        event="indicator_viewed"
        properties={{
          indicator_id: indicator.id,
          indicator_name: indicator.name,
          meta_index: indicator.meta_index,
          global_avg_stress: meanStress,
        }}
      />
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wider text-foreground-muted font-medium">
            <Link href="/countries" className="hover:text-foreground transition-colors">
              ← Indicators
            </Link>
            <span aria-hidden="true">·</span>
            <MetaCategoryBadge meta={indicator.meta_index} variant="dot" size="sm" />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            {indicator.name} by country
          </h1>

          {indicator.description && (
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl leading-relaxed">
              {indicator.description}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-6">
            {meanStress !== null && (
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                  Global average stress
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono tabular-nums text-4xl sm:text-5xl font-semibold">
                    {meanStress.toFixed(1)}
                  </span>
                  {bandFor(meanStress) && (
                    <span
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: `var(--band-${bandFor(meanStress)})` }}
                    >
                      {bandFor(meanStress)}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                Countries covered
              </div>
              <div className="font-mono tabular-nums text-4xl sm:text-5xl font-semibold">
                {values.length}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                Unit
              </div>
              <div className="text-2xl font-medium text-foreground-muted">
                {indicator.unit ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TREND ── */}
      {trend.length >= 2 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
              Global trend
            </h2>
            <p className="text-foreground-muted">
              Mean stress score across all countries for which data is available,
              over the last 12 months.
            </p>
          </div>
          <CompositeLineChart data={trend} height={280} />
        </section>
      )}

      {/* ── TOP / BOTTOM 5 ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Where the pressure is concentrated
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          The five most-affected and five least-affected countries on this
          indicator right now.
        </p>
        <div className="grid md:grid-cols-2 gap-10">
          <CountryColumn title="Most affected" countries={top5} unit={indicator.unit} />
          <CountryColumn title="Least affected" countries={bottom5} unit={indicator.unit} />
        </div>
      </section>

      {/* ── FULL RANKING ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Full ranking
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          All {values.length} tracked countries, ordered from most to least
          affected. Click any country to see its full composite breakdown.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-strong text-xs uppercase tracking-wider text-foreground-muted">
                <th className="text-left py-3 pl-2 pr-3 font-medium w-12">#</th>
                <th className="text-left py-3 pr-3 font-medium">Country</th>
                <th className="text-right py-3 pr-3 font-medium">Raw value</th>
                <th className="text-right py-3 pr-3 font-medium">Stress score</th>
                <th className="text-right py-3 pr-3 font-medium">As of</th>
              </tr>
            </thead>
            <tbody>
              {values.map((v, i) => {
                const b = bandFor(v.normalized_value);
                return (
                  <tr
                    key={v.country_code}
                    className="border-b border-border hover:bg-background-alt/50"
                  >
                    <td className="py-3 pl-2 pr-3 text-foreground-subtle tabular-nums text-xs">
                      {i + 1}
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/country/${v.country_code.toLowerCase()}`}
                        className="inline-flex items-center gap-2 hover:underline underline-offset-2 decoration-foreground-subtle/40"
                      >
                        <span className="text-lg" aria-hidden="true">
                          {v.flag_emoji ?? '🏳️'}
                        </span>
                        <span className="font-medium">{v.country_name}</span>
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums text-foreground-muted">
                      {formatRaw(v.raw_value, indicator.unit)}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <span
                        className="font-mono tabular-nums text-base font-semibold"
                        style={{ color: b ? `var(--band-${b})` : undefined }}
                      >
                        {v.normalized_value !== null ? v.normalized_value.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right text-xs text-foreground-muted tabular-nums">
                      {v.reference_date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          Why it matters
        </h2>
        <div className="prose prose-thi">
          <p>
            {indicator.name} is a contributing indicator to the{' '}
            <strong>{META_LABELS[indicator.meta_index]}</strong> meta-index,
            one of the five dimensions of The Human Index composite. {directionLabel}.
          </p>
          {indicator.weight_within_meta !== 1 && (
            <p>
              Its weight within the {META_LABELS[indicator.meta_index]} meta-index
              is {(indicator.weight_within_meta * 100).toFixed(0)}% (relative to
              other indicators in the same domain).
            </p>
          )}
          <p>
            Movements in this indicator are tracked daily and feed into every
            country&apos;s composite score on the next cron cycle.
          </p>
        </div>
      </section>

      {/* ── RELATED PULSE ── */}
      {related.length > 0 && (
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
          <ul className="divide-y divide-border border-y border-border">
            {related.map((r) => (
              <li key={r.slug + r.country_code}>
                <Link
                  href={`/pulse/${r.slug}`}
                  className="flex items-center justify-between gap-4 py-4 group hover:bg-background-alt/40 -mx-4 px-4 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                      {r.country_code === 'global' ? 'Global' : r.country_code}
                    </div>
                    <h3 className="font-serif text-lg font-semibold leading-snug group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                      {r.title}
                    </h3>
                  </div>
                  <time
                    dateTime={r.published_at}
                    className="text-xs text-foreground-subtle tabular-nums shrink-0"
                  >
                    {new Date(r.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── SOURCE ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium mb-4">
            Source & methodology
          </h2>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              {indicator.source_org && (
                <div className="mb-3">
                  <SourceAttribution
                    source={indicator.source_org}
                    href={indicator.source_url ?? undefined}
                    referenceDate={values[0]?.reference_date ?? null}
                    freshness={freshnessFor(values[0]?.reference_date ?? null)}
                    variant="block"
                  />
                </div>
              )}
              <p className="text-sm text-foreground-muted leading-relaxed">
                Raw values are normalized to a 0–100 stress scale per the
                bounds documented in the codebase. See methodology for the
                full normalization and band-threshold derivation.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/methodology"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                Methodology
              </Link>
              <Link
                href="/data-sources"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                Source health
              </Link>
              <Link
                href={`/api/trends/us/${indicator.id}`}
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                JSON API
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

// ── Country column ─────────────────────────────────────────────────

function CountryColumn({
  title,
  countries,
  unit,
}: {
  title: string;
  countries: CountryValueRow[];
  unit: string | null;
}) {
  return (
    <div>
      <h3 className="font-serif text-xl font-semibold mb-5">{title}</h3>
      <ul className="divide-y divide-border border-y border-border">
        {countries.map((c, i) => {
          const b = bandFor(c.normalized_value);
          return (
            <li key={c.country_code} className="py-3 flex items-center gap-3">
              <span className="text-xs text-foreground-subtle tabular-nums w-6">
                {i + 1}
              </span>
              <span className="text-lg" aria-hidden="true">
                {c.flag_emoji ?? '🏳️'}
              </span>
              <Link
                href={`/country/${c.country_code.toLowerCase()}`}
                className="flex-1 text-base font-medium hover:underline underline-offset-2 decoration-foreground-subtle/40 truncate"
              >
                {c.country_name}
              </Link>
              <span className="font-mono tabular-nums text-xs text-foreground-muted whitespace-nowrap">
                {formatRaw(c.raw_value, unit)}
              </span>
              <span
                className="font-mono tabular-nums text-base font-semibold w-12 text-right"
                style={{ color: b ? `var(--band-${b})` : undefined }}
              >
                {c.normalized_value !== null ? c.normalized_value.toFixed(0) : '—'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
