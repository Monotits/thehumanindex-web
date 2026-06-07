import type { Metadata } from 'next';
import Link from 'next/link';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { TOP_10_CATALOG } from '@/lib/ui/top10-catalog';

export const metadata: Metadata = {
  title: 'Country rankings | The Human Index',
  description:
    'Live data-driven country rankings — most stressed countries, best for mental health, most exposed to AI, housing crisis severity, and more. Pipeline re-checks every 12 hours.',
  alternates: { canonical: 'https://thehumanindex.org/top-10' },
};

export const revalidate = 3600;

export default function Top10IndexPage() {
  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Rankings · {TOP_10_CATALOG.length} lists
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Where does your country stand?
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Live, data-driven rankings across the dimensions that shape
              everyday life. The pipeline re-checks every 12 hours from the same
              indicator pipeline that powers the composite score.
            </p>
          </div>
        </div>
      </section>

      {/* ── LIST GRID ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOP_10_CATALOG.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/top-10/${e.slug}`}
                className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-5 transition-colors h-full"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-2">
                  {e.source.kind === 'composite' && <span>Composite</span>}
                  {e.source.kind === 'meta' && (
                    <MetaCategoryBadge meta={e.source.meta_index} variant="dot" size="sm" />
                  )}
                  {e.source.kind === 'indicator' && <span>Indicator</span>}
                </div>
                <h3 className="font-serif text-lg font-semibold leading-snug mb-2 group-hover:underline decoration-foreground-subtle/40 underline-offset-2 text-balance">
                  {e.title}
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                  {e.subhead}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
