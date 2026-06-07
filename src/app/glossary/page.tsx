import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { META_INDEXES, type MetaIndex } from '@/lib/ui/tokens';
import { getActiveLocale } from '@/lib/ui/locale';

export const metadata: Metadata = {
  title: 'Glossary — The Human Index',
  description:
    'Definitions for every indicator, meta-index, and concept used by The Human Index. Every term traceable to its source.',
  alternates: { canonical: 'https://thehumanindex.org/glossary' },
};

// Locale-aware: dynamic so we re-render per NEXT_LOCALE cookie.
export const dynamic = 'force-dynamic';

interface GlossaryRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  term: string;
  short_definition: string;
  related_meta_indexes: string[] | null;
  published_at: string;
}

async function loadGlossary(locale: string): Promise<{
  entries: GlossaryRow[];
  fallbackUsed: boolean;
}> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return { entries: [], fallbackUsed: false };

  const sb = createClient(sbUrl, sbKey);

  // Try requested locale (global country first); fall back to English
  let res = await sb
    .from('glossary_entries')
    .select(
      'id, slug, country_code, locale, term, short_definition, related_meta_indexes, published_at',
    )
    .eq('locale', locale)
    .eq('country_code', 'global')
    .order('term', { ascending: true })
    .limit(200);

  let fallbackUsed = false;
  if (!res.data || res.data.length === 0) {
    if (locale !== 'en') {
      fallbackUsed = true;
      res = await sb
        .from('glossary_entries')
        .select(
          'id, slug, country_code, locale, term, short_definition, related_meta_indexes, published_at',
        )
        .eq('locale', 'en')
        .eq('country_code', 'global')
        .order('term', { ascending: true })
        .limit(200);
    }
  }

  return { entries: (res.data ?? []) as GlossaryRow[], fallbackUsed };
}

export default async function GlossaryPage() {
  const locale = await getActiveLocale();
  const { entries, fallbackUsed } = await loadGlossary(locale);

  // Group entries alphabetically
  const groups = new Map<string, GlossaryRow[]>();
  for (const e of entries) {
    const letter = e.term.trim().charAt(0).toUpperCase() || '#';
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const letters = Array.from(groups.keys()).sort();

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Glossary
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Every term, defined.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Indicators, meta-indexes, methodology vocabulary. Each entry
              connects back to where the underlying data comes from.
            </p>
          </div>
        </div>
      </section>

      {/* ── ALPHA INDEX ── */}
      {letters.length > 0 && (
        <section className="border-b border-border sticky top-14 z-30 bg-background/90 backdrop-blur-sm">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {letters.map((l) => (
                <a
                  key={l}
                  href={`#letter-${l}`}
                  className="inline-flex w-7 h-7 sm:w-8 sm:h-8 items-center justify-center text-xs font-mono font-medium text-foreground-muted hover:text-foreground hover:bg-background-alt rounded transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ENTRIES ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {entries.length === 0 ? (
          <p className="text-foreground-muted text-center py-20">
            No glossary entries available yet.
          </p>
        ) : (
          <div className="space-y-12 max-w-4xl">
            {letters.map((letter) => {
              const items = groups.get(letter)!;
              return (
                <div key={letter} id={`letter-${letter}`} className="scroll-mt-32">
                  <h2 className="font-serif text-3xl font-semibold mb-5 text-foreground-muted">
                    {letter}
                  </h2>
                  <ul className="divide-y divide-border border-y border-border">
                    {items.map((e) => (
                      <GlossaryItem key={e.id} entry={e} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function GlossaryItem({ entry }: { entry: GlossaryRow }) {
  const validMeta = (entry.related_meta_indexes ?? []).filter(
    (m): m is MetaIndex => (META_INDEXES as readonly string[]).includes(m),
  );
  return (
    <li>
      <Link
        href={`/glossary/${entry.slug}`}
        className="group block py-5 -mx-4 px-4 rounded hover:bg-background-alt/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-serif text-xl font-semibold leading-snug group-hover:underline decoration-foreground-subtle/40 underline-offset-2 text-balance">
            {entry.term}
          </h3>
          {validMeta.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {validMeta.slice(0, 2).map((m) => (
                <MetaCategoryBadge key={m} meta={m} variant="pill" size="sm" />
              ))}
            </div>
          )}
        </div>
        <p className="text-sm sm:text-base text-foreground-muted leading-relaxed text-pretty line-clamp-2">
          {entry.short_definition}
        </p>
      </Link>
    </li>
  );
}
