import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { StressBand } from '@/components/ui/StressBand';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { bandFor, META_INDEXES, META_LABELS, META_WEIGHT, type MetaIndex } from '@/lib/ui/tokens';

export const metadata: Metadata = {
  title: 'The Human Index — Civilizational Stress Tracker',
  description:
    'Real-time civilizational stress measurement across 25 countries and 31 indicators. Composite scores updated continuously. Editorial overlay in 9 languages.',
  alternates: { canonical: 'https://thehumanindex.org' },
};

// ISR — refreshed every 30 min, but the cron actually updates the underlying
// data every 12h, so this is mostly to bust the next-data cache.
export const revalidate = 1800;

interface CountrySummary {
  country_code: string;
  name: string;
  flag_emoji: string | null;
  composite: number;
}

interface MetaAvg {
  meta: MetaIndex;
  avg: number;
}

interface PulsePreview {
  country_code: string;
  locale: string;
  title: string;
  slug: string;
  published_at: string;
}

async function loadHomeData() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return { countries: [], metaAvgs: [], pulses: [], globalAvg: null, lastUpdate: null };
  }
  const sb = createClient(sbUrl, sbKey);

  // 1. Latest composite per country + country name
  const compositesRes = await sb
    .from('v_country_latest_composite')
    .select('country_code, score_value, computed_at');
  const composites = (compositesRes.data ?? []) as Array<{
    country_code: string;
    score_value: number;
    computed_at: string;
  }>;

  const countriesRes = await sb
    .from('countries')
    .select('code, name, flag_emoji')
    .eq('active', true);
  const countryMeta = new Map(
    (countriesRes.data ?? []).map((r) => [
      (r as { code: string }).code,
      r as { code: string; name: string; flag_emoji: string | null },
    ]),
  );

  const countries: CountrySummary[] = composites
    .map((c) => {
      const meta = countryMeta.get(c.country_code);
      return {
        country_code: c.country_code,
        name: meta?.name ?? c.country_code,
        flag_emoji: meta?.flag_emoji ?? null,
        composite: c.score_value,
      };
    })
    .sort((a, b) => b.composite - a.composite);

  const lastUpdate =
    composites.reduce<string | null>(
      (acc, c) => (acc && acc > c.computed_at ? acc : c.computed_at),
      null,
    ) ?? null;

  // 2. Latest meta-index averages across countries
  const latestComposites = composites.map((c) =>
    sb
      .from('country_composite_scores')
      .select('id')
      .eq('country_code', c.country_code)
      .order('computed_at', { ascending: false })
      .limit(1),
  );
  // Pull meta_index_scores for latest composite per country in bulk
  const ids = (
    await Promise.all(latestComposites.map((q) => q.then((r) => r.data?.[0]?.id)))
  ).filter(Boolean) as string[];

  const metaRes = await sb
    .from('meta_index_scores')
    .select('meta_index, value')
    .in('country_composite_score_id', ids);
  const metaRows = (metaRes.data ?? []) as Array<{ meta_index: MetaIndex; value: number | null }>;

  const metaSums = new Map<MetaIndex, { sum: number; count: number }>();
  for (const m of META_INDEXES) metaSums.set(m, { sum: 0, count: 0 });
  for (const row of metaRows) {
    if (row.value === null) continue;
    const bucket = metaSums.get(row.meta_index);
    if (!bucket) continue;
    bucket.sum += row.value;
    bucket.count += 1;
  }
  const metaAvgs: MetaAvg[] = META_INDEXES.map((m) => {
    const b = metaSums.get(m)!;
    return { meta: m, avg: b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : 0 };
  });

  // Global avg composite
  const globalAvg =
    countries.length > 0
      ? Math.round((countries.reduce((s, c) => s + c.composite, 0) / countries.length) * 10) / 10
      : null;

  // 3. Latest pulses, 4 most recent across (country, locale=en)
  const pulsesRes = await sb
    .from('commentary')
    .select('country_code, locale, title, slug, published_at')
    .eq('type', 'weekly_pulse')
    .eq('locale', 'en')
    .order('published_at', { ascending: false })
    .limit(4);
  const pulses = (pulsesRes.data ?? []) as PulsePreview[];

  return { countries, metaAvgs, pulses, globalAvg, lastUpdate };
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default async function HomePage() {
  const { countries, metaAvgs, pulses, globalAvg, lastUpdate } = await loadHomeData();

  const top5 = countries.slice(0, 5);
  const bottom5 = countries.slice(-5).reverse();
  const globalBand = bandFor(globalAvg);

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-4 font-medium">
              Civilizational Stress · live tracker
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-balance">
              The world is not on fire,
              <br className="hidden sm:inline" /> but the stress is{' '}
              <span className={globalBand ? `band-text-${globalBand}` : 'text-foreground'}>
                measurable
              </span>
              .
            </h1>
            <p className="mt-6 text-lg text-foreground-muted text-pretty max-w-2xl">
              The Human Index tracks 25 countries across 31 indicators in five domains —
              economic, social, mental, technological, environmental. Updated every 12 hours.
              Every number is traceable to its source.
            </p>
            {globalAvg !== null && (
              <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-10">
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                    Global average
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono tabular-nums text-4xl sm:text-5xl font-semibold">
                      {globalAvg.toFixed(1)}
                    </span>
                    {globalBand && (
                      <StressBand band={globalBand} score={null} showScore={false} variant="inline" size="lg" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                    Countries
                  </div>
                  <div className="font-mono tabular-nums text-4xl sm:text-5xl font-semibold">
                    {countries.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                    Last update
                  </div>
                  <div className="text-base sm:text-lg text-foreground-muted mt-3">
                    {formatRelativeTime(lastUpdate)}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/rankings"
                className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                View full ranking
              </Link>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP / BOTTOM 5 ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 gap-10">
          <CountryColumn
            title="Highest stress"
            countries={top5}
            ordered="desc"
          />
          <CountryColumn
            title="Lowest stress"
            countries={bottom5}
            ordered="asc"
          />
        </div>
      </section>

      {/* ── META AVERAGES ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
            Five dimensions of stress
          </h2>
          <p className="text-foreground-muted max-w-2xl mb-10">
            Each composite score is a weighted average of five meta-indexes. Below, the
            global average across all {countries.length} countries for each.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {metaAvgs.map((m) => (
              <MetaCard key={m.meta} meta={m.meta} avg={m.avg} />
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST PULSES ── */}
      {pulses.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-border">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Latest analysis</h2>
            <Link
              href="/pulse"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              All Pulses →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {pulses.map((p) => (
              <Link
                key={p.slug + p.country_code}
                href={`/pulse/${p.slug}`}
                className="group block rounded-lg border border-border bg-background-alt/30 hover:bg-background-alt p-6 transition-colors"
              >
                <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-2">
                  {p.country_code === 'global' ? 'Global' : p.country_code}
                </div>
                <h3 className="font-serif text-xl font-semibold leading-snug mb-3 group-hover:underline decoration-foreground-subtle/40 underline-offset-2 text-balance">
                  {p.title}
                </h3>
                <div className="text-xs text-foreground-muted tabular-nums">
                  {new Date(p.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── TRUST BLOCK ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-4 gap-8">
            <TrustStat label="Indicators" value="31" caption="Active per cron run" />
            <TrustStat label="Data sources" value="6" caption="WB · Eurostat · IMF · OECD · WRI · IHME" />
            <TrustStat label="Languages" value="9" caption="Per-country editorial framing" />
            <TrustStat label="Cron cadence" value="12h" caption="Continuous composite refresh" />
          </div>
          <div className="mt-10 flex flex-wrap gap-4 text-sm">
            <Link href="/methodology" className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40">
              Read the methodology
            </Link>
            <span className="text-foreground-subtle">·</span>
            <Link href="/data-sources" className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40">
              All sources
            </Link>
            <span className="text-foreground-subtle">·</span>
            <Link href="/transparency" className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40">
              Transparency
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub components ─────────────────────────────────────────────────

function CountryColumn({
  title,
  countries,
}: {
  title: string;
  countries: CountrySummary[];
  ordered: 'asc' | 'desc';
}) {
  return (
    <div>
      <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-5">{title}</h2>
      <ul className="divide-y divide-border border-y border-border">
        {countries.map((c, i) => (
          <li key={c.country_code} className="py-3 flex items-center gap-4">
            <span className="text-xs text-foreground-subtle tabular-nums w-6">{i + 1}</span>
            <span className="text-lg" aria-hidden="true">{c.flag_emoji ?? '🏳️'}</span>
            <Link
              href={`/country/${c.country_code.toLowerCase()}`}
              className="flex-1 text-base font-medium hover:underline underline-offset-2 decoration-foreground-subtle/40"
            >
              {c.name}
            </Link>
            <StressBand score={c.composite} variant="pill" size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetaCard({ meta, avg }: { meta: MetaIndex; avg: number }) {
  const band = bandFor(avg);
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <MetaCategoryBadge meta={meta} variant="dot" size="sm" />
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono tabular-nums text-3xl font-semibold">{avg.toFixed(1)}</span>
        {band && (
          <span className={`band-text-${band} text-xs font-medium`}>
            {band}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-foreground-subtle tabular-nums">
        weight {META_WEIGHT[meta] * 100}%
      </div>
      <div className="mt-2 text-xs text-foreground-muted">
        {META_LABELS[meta]} avg
      </div>
    </div>
  );
}

function TrustStat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">{label}</div>
      <div className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold mb-1">{value}</div>
      <div className="text-sm text-foreground-muted">{caption}</div>
    </div>
  );
}
