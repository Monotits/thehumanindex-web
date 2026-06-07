import type { Metadata } from 'next';
import Link from 'next/link';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { TOPIC_CATALOG } from '@/lib/ui/topic-catalog';

export const metadata: Metadata = {
  title: 'Topics | The Human Index',
  description:
    'Browse civilizational stress by topic — AI & jobs, housing, mental health, climate, inequality, social trust. Each topic combines indicators, country rankings, and recent analysis.',
  alternates: { canonical: 'https://thehumanindex.org/topics' },
};

export const revalidate = 3600;

export default function TopicsIndex() {
  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Topics · {TOPIC_CATALOG.length} hubs
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              The pressures shaping 2026.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Each topic gathers the indicators, country rankings, and recent
              editorial analysis under one lens — so you can scan the whole
              question in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPIC_CATALOG.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/topics/${t.slug}`}
                className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 p-6 transition-colors h-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl" aria-hidden="true">{t.emoji}</span>
                  <MetaCategoryBadge meta={t.meta} variant="dot" size="sm" />
                </div>
                <h2 className="font-serif text-xl font-semibold leading-snug mb-2 group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                  {t.title}
                </h2>
                <p className="text-sm text-foreground-muted leading-relaxed line-clamp-3">
                  {t.subhead}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
