/**
 * Answer-first "Key facts" block + FAQPage JSON-LD.
 *
 * Search and answer engines (Google AI Overviews, ChatGPT search, Perplexity,
 * Claude) quote short, self-contained sentences that carry the number, the
 * date and the source. Every answer here is generated from the same published
 * numbers the page shows, so it can never drift from the data.
 */

import { JsonLd } from '@/components/JsonLd';

export interface Fact { q: string; a: string }

export function KeyFacts({ facts, title = 'Key facts', id = 'key-facts' }: { facts: Fact[]; title?: string; id?: string }) {
  if (facts.length === 0) return null;
  return (
    <section id={id} className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-border scroll-mt-24">
      <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-5">{title}</h2>
      <dl className="grid gap-5 sm:grid-cols-2 max-w-5xl">
        {facts.map(f => (
          <div key={f.q}>
            <dt className="text-sm font-medium text-foreground">{f.q}</dt>
            <dd className="mt-1 text-sm text-foreground-muted leading-relaxed text-pretty">{f.a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: facts.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }}
      />
    </section>
  );
}

export function longDateUTC(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
