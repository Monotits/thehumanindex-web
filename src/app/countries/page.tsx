import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CountriesExplorer, type ExplorerRow } from './CountriesExplorer';
import { type MetaIndex } from '@/lib/ui/tokens';
import { loadCompositeHistory, pointsToDenseSeries } from '@/lib/ui/history';

export const metadata: Metadata = {
  title: 'Countries — The Human Index',
  description:
    'Civilizational stress composite scores across 25 countries. Switch between grid, sortable table, world map, and heatmap views.',
  alternates: { canonical: 'https://thehumanindex.org/countries' },
};

export const revalidate = 1800;

async function loadData(): Promise<ExplorerRow[]> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];

  const sb = createClient(sbUrl, sbKey);

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

  const codes = composites.map((c) => c.country_code);
  const historyMap = await loadCompositeHistory(codes, 60);

  return composites
    .map((c) => {
      const meta = countryMeta.get(c.country_code);
      return {
        country_code: c.country_code,
        name: meta?.name ?? c.country_code,
        flag_emoji: meta?.flag_emoji ?? null,
        composite: c.score_value,
        meta: perCountry.get(c.country_code) ?? {},
        history: pointsToDenseSeries(historyMap.get(c.country_code) ?? [], 60),
      };
    })
    .sort((a, b) => b.composite - a.composite);
}

/** Light skeleton shown during Suspense — matches Cards default view spacing. */
function ExplorerSkeleton() {
  return (
    <div>
      <div className="mb-8 border-b border-border">
        <div className="flex gap-1 h-10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background h-44 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default async function CountriesPage() {
  const rows = await loadData();

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Countries · {rows.length} tracked
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Twenty-five countries, four ways to read them.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Switch view to see the same data as cards, a sortable table, a
              choropleth, or a dense heatmap. Composite plus the five
              meta-index breakdown for every country.
            </p>
          </div>
        </div>
      </section>

      {/* ── EXPLORER ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8" id="explore">
        {rows.length === 0 ? (
          <p className="text-foreground-muted text-sm">
            No data available right now. Try again shortly.
          </p>
        ) : (
          // Suspense boundary required because CountriesExplorer uses
          // useSearchParams() — Next.js needs this to statically prerender
          // the page without bailing out to client-side rendering.
          <Suspense fallback={<ExplorerSkeleton />}>
            <CountriesExplorer rows={rows} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
