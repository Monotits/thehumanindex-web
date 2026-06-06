import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { StressBand } from '@/components/ui/StressBand';
import {
  bandFor,
  META_INDEXES,
  META_LABELS,
  type MetaIndex,
} from '@/lib/ui/tokens';

export const metadata: Metadata = {
  title: 'Countries — The Human Index',
  description:
    'Civilizational stress composite scores across 25 countries. Each card shows the overall composite and a breakdown across five meta-indexes: economic, social, mental, technological, environmental.',
  alternates: { canonical: 'https://thehumanindex.org/countries' },
};

export const revalidate = 1800;

interface CountryRow {
  country_code: string;
  name: string;
  flag_emoji: string | null;
  composite: number;
  meta: Partial<Record<MetaIndex, number>>;
}

async function loadCountries(): Promise<CountryRow[]> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];

  const sb = createClient(sbUrl, sbKey);

  // Three parallel queries — no per-country fan-out
  const [compositesRes, countriesRes, metaRes] = await Promise.all([
    sb.from('v_country_latest_composite').select('country_code, score_value'),
    sb.from('countries').select('code, name, flag_emoji').eq('active', true),
    sb.from('v_country_latest_meta_indexes').select('country_code, meta_index, value'),
  ]);

  const composites = (compositesRes.data ?? []) as Array<{
    country_code: string;
    score_value: number;
  }>;
  const countryMeta = new Map(
    (countriesRes.data ?? []).map((r) => [
      (r as { code: string }).code,
      r as { code: string; name: string; flag_emoji: string | null },
    ]),
  );
  const metaRows = (metaRes.data ?? []) as Array<{
    country_code: string;
    meta_index: MetaIndex;
    value: number | null;
  }>;

  const perCountry = new Map<string, Partial<Record<MetaIndex, number>>>();
  for (const row of metaRows) {
    if (row.value === null) continue;
    if (!perCountry.has(row.country_code)) perCountry.set(row.country_code, {});
    perCountry.get(row.country_code)![row.meta_index] = row.value;
  }

  return composites
    .map((c) => {
      const meta = countryMeta.get(c.country_code);
      return {
        country_code: c.country_code,
        name: meta?.name ?? c.country_code,
        flag_emoji: meta?.flag_emoji ?? null,
        composite: c.score_value,
        meta: perCountry.get(c.country_code) ?? {},
      };
    })
    .sort((a, b) => b.composite - a.composite);
}

export default async function CountriesPage() {
  const countries = await loadCountries();

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Country directory
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              All {countries.length} countries, ranked by composite stress.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Every card shows the overall composite and the five-dimension breakdown
              (economic, social, mental, technological, environmental). Click any
              country to see indicator-level detail with sources.
            </p>
          </div>
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {countries.length === 0 ? (
          <div className="text-foreground-muted text-sm">
            No data available right now. Try again shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((c, i) => (
              <CountryCard key={c.country_code} country={c} rank={i + 1} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────

function CountryCard({ country, rank }: { country: CountryRow; rank: number }) {
  const band = bandFor(country.composite);
  return (
    <Link
      href={`/country/${country.country_code.toLowerCase()}`}
      className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 transition-colors p-5"
    >
      {/* Top row: rank + flag + name */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-foreground-subtle tabular-nums w-6">
          #{rank}
        </span>
        <span className="text-2xl shrink-0" aria-hidden="true">
          {country.flag_emoji ?? '🏳️'}
        </span>
        <span className="text-base font-semibold flex-1 group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
          {country.name}
        </span>
      </div>

      {/* Composite */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono tabular-nums text-3xl font-semibold">
          {country.composite.toFixed(1)}
        </span>
        {band && (
          <StressBand band={band} score={null} showScore={false} variant="pill" size="sm" />
        )}
      </div>

      {/* Meta breakdown — mini horizontal bars */}
      <div className="space-y-1.5">
        {META_INDEXES.map((m) => (
          <MetaBar key={m} meta={m} value={country.meta[m] ?? null} />
        ))}
      </div>
    </Link>
  );
}

function MetaBar({ meta, value }: { meta: MetaIndex; value: number | null }) {
  const pct = value !== null ? Math.min(100, Math.max(0, value)) : 0;
  const band = bandFor(value);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 sm:w-24 text-foreground-muted shrink-0 truncate">
        {META_LABELS[meta]}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-background-alt overflow-hidden">
        {value !== null && (
          <div
            className={band ? `band-bg-${band}` : 'bg-foreground-subtle'}
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: band ? `var(--band-${band})` : undefined,
              opacity: 0.85,
            }}
          />
        )}
      </div>
      <span className="font-mono tabular-nums text-foreground-muted w-9 text-right">
        {value !== null ? value.toFixed(0) : '—'}
      </span>
    </div>
  );
}
