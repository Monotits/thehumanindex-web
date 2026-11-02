import type { Metadata } from 'next';
import Link from 'next/link';
import { CHANGELOG, CURRENT_METHOD_VERSION, type ChangeKind } from '@/lib/changelog/entries';

export const metadata: Metadata = {
  title: 'Changelog — methodology & data changes',
  description: 'Every change that can move a published number on The Human Index: methodology versions, data refreshes, fixes.',
  alternates: { canonical: 'https://thehumanindex.org/changelog' },
};

export const dynamic = 'force-static';

const KIND_LABEL: Record<ChangeKind, string> = { methodology: 'Methodology', data: 'Data', new: 'New', fix: 'Fix' };
const KIND_CLASS: Record<ChangeKind, string> = {
  methodology: 'band-text-elevated', data: 'text-foreground', new: 'band-text-low', fix: 'text-foreground-muted',
};

export default function ChangelogPage() {
  const byDate = new Map<string, typeof CHANGELOG>();
  for (const e of CHANGELOG) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">Changelog</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">What changed, and why</h1>
          <p className="mt-4 text-lg text-foreground-muted text-pretty">
            Every change that can move a published number is recorded here. Current methodology version:{' '}
            <strong className="text-foreground">v{CURRENT_METHOD_VERSION}</strong>. See the{' '}
            <Link href="/methodology" className="underline decoration-foreground-subtle/40 underline-offset-2">methodology</Link> and{' '}
            <Link href="/data-sources" className="underline decoration-foreground-subtle/40 underline-offset-2">data sources</Link>.
          </p>
        </div>
      </section>
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {Array.from(byDate.entries()).map(([date, entries]) => (
          <div key={date} className="mb-10">
            <h2 className="font-mono text-sm text-foreground-subtle mb-4">
              {new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
            </h2>
            <ul className="space-y-6">
              {entries.map(e => (
                <li key={e.title} className="border-l-2 border-border pl-4">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className={`text-xs uppercase tracking-wider font-medium ${KIND_CLASS[e.kind]}`}>{KIND_LABEL[e.kind]}</span>
                    <span className="text-xs text-foreground-subtle font-mono">v{e.version}</span>
                  </div>
                  <h3 className="font-serif text-xl font-semibold mt-1">{e.title}</h3>
                  <p className="mt-2 text-foreground-muted text-pretty">{e.detail}</p>
                  {e.effect && <p className="mt-2 text-sm"><span className="text-foreground-subtle">Effect: </span>{e.effect}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
