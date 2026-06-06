import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { RankingsTable } from './RankingsTable';
import { type MetaIndex } from '@/lib/ui/tokens';

export const metadata: Metadata = {
  title: 'Rankings — The Human Index',
  description:
    'Full sortable ranking of 25 countries by civilizational stress composite and each of the five meta-indexes: economic, social, mental, technological, environmental.',
  alternates: { canonical: 'https://thehumanindex.org/rankings' },
};

export const revalidate = 1800;

export interface RankingRow {
  country_code: string;
  name: string;
  flag_emoji: string | null;
  composite: number;
  meta: Partial<Record<MetaIndex, number>>;
}

async function loadRankings(): Promise<RankingRow[]> {
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

export default async function RankingsPage() {
  const rows = await loadRankings();

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Rankings
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Composite stress, ranked.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Click any column header to sort. Composite is a weighted average:
              economic 25%, social 20%, mental 20%, technological 20%, environmental 15%.
              Lower is better.
            </p>
          </div>
        </div>
      </section>

      {/* ── TABLE ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {rows.length === 0 ? (
          <div className="text-foreground-muted text-sm">
            No data available right now. Try again shortly.
          </div>
        ) : (
          <RankingsTable rows={rows} />
        )}
      </section>
    </div>
  );
}
