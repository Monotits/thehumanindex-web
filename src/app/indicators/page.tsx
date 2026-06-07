import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { META_INDEXES, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';

export const metadata: Metadata = {
  title: 'Every indicator we track | The Human Index',
  description:
    'Every indicator we track across 25 countries, grouped by meta-index domain. From housing affordability to inflation to automation exposure to temperature anomaly — each links to a full country ranking.',
  alternates: { canonical: 'https://thehumanindex.org/indicators' },
};

export const revalidate = 3600;

interface IndicatorRow {
  id: string;
  meta_index: MetaIndex;
  name: string;
  description: string | null;
  unit: string | null;
  source_org: string | null;
}

async function loadIndicators(): Promise<IndicatorRow[]> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];
  const sb = createClient(sbUrl, sbKey);
  const res = await sb
    .from('indicators')
    .select('id, meta_index, name, description, unit, source_org')
    .eq('active', true)
    .order('display_order', { ascending: true });
  return (res.data ?? []) as IndicatorRow[];
}

export default async function IndicatorsIndexPage() {
  const indicators = await loadIndicators();

  // Group by meta-index
  const byMeta = new Map<MetaIndex, IndicatorRow[]>();
  for (const m of META_INDEXES) byMeta.set(m, []);
  for (const ind of indicators) {
    if (!byMeta.has(ind.meta_index)) byMeta.set(ind.meta_index, []);
    byMeta.get(ind.meta_index)!.push(ind);
  }

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Indicators · {indicators.length} tracked
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Every signal we measure.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Grouped by the five meta-index domains. Click any indicator to
              see the live ranking across all 25 tracked countries plus the
              12-month global trend.
            </p>
          </div>
        </div>
      </section>

      {/* ── INDICATORS GROUPED ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-12">
          {META_INDEXES.map((m) => {
            const list = byMeta.get(m) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={m}>
                <div className="flex items-center gap-3 mb-5">
                  <MetaCategoryBadge meta={m} variant="dot" size="md" />
                  <span className="text-xs uppercase tracking-wider text-foreground-subtle font-medium">
                    {list.length} indicator{list.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((ind) => (
                    <li key={ind.id}>
                      <Link
                        href={`/indicator/${ind.id}`}
                        className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-4 transition-colors h-full"
                      >
                        <h3 className="font-serif text-base font-semibold leading-snug mb-1 group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                          {ind.name}
                        </h3>
                        {ind.description && (
                          <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2 mb-2">
                            {ind.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 text-[11px] text-foreground-subtle">
                          {ind.source_org && <span className="truncate">{ind.source_org}</span>}
                          {ind.unit && <span className="font-mono shrink-0">{ind.unit}</span>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── WHAT WE DON'T MEASURE (yet) ── */}
      {/* Honest disclosure block. If a user wonders 'why isn't X here?',
          this is where they find the answer — not in a missing indicator
          row that contradicts an article. */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-3">
            What we don&apos;t measure — yet.
          </h2>
          <p className="text-foreground-muted text-sm leading-relaxed mb-6">
            Tried, didn&apos;t make the bar. We keep this list public so
            articles never reference a metric the catalog can&apos;t back up.
          </p>
          <ul className="space-y-4 text-sm">
            <li className="border-l-2 border-foreground-subtle/30 pl-4">
              <div className="font-medium text-foreground">
                AI Job Anxiety
              </div>
              <div className="text-foreground-muted leading-relaxed">
                Computed from social-feed sentiment. Produced one global
                value (≈79.8) applied to every country — no per-country
                discriminating power. Disabled in our internal audit
                (migration 022). Will re-enable when we have a real
                per-country sentiment source.
              </div>
            </li>
            <li className="border-l-2 border-foreground-subtle/30 pl-4">
              <div className="font-medium text-foreground">
                Civil unrest events
              </div>
              <div className="text-foreground-muted leading-relaxed">
                ACLED/GDELT integrations were prototyped early on but the
                normalization story (one protest ≠ one protest across
                contexts) never converged. The Social meta-index currently
                relies on homicide rate, suicide rate, and trust in
                institutions instead — fewer signals, cleaner attribution.
              </div>
            </li>
            <li className="border-l-2 border-foreground-subtle/30 pl-4">
              <div className="font-medium text-foreground">
                Per-country temperature trend (live)
              </div>
              <div className="text-foreground-muted leading-relaxed">
                NASA GISS gives one global anomaly; that&apos;s not per-country
                signal. We currently seed from Berkeley Earth&apos;s 2024
                per-country dataset (refreshed annually). Switching to a
                truly live per-country temperature API is on the list.
              </div>
            </li>
          </ul>
          <p className="text-xs text-foreground-subtle mt-6 leading-relaxed">
            Read the full audit trail and per-source health in{' '}
            <Link
              href="/transparency"
              className="underline underline-offset-2 decoration-foreground-subtle/40 hover:text-foreground"
            >
              Transparency
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Suppress unused */}
      {void META_LABELS as unknown as null}
    </div>
  );
}
