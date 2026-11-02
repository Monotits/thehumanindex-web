import type { Metadata } from 'next';
import Link from 'next/link';
import { REPORTS, reportTitle } from '@/lib/reports';

export const metadata: Metadata = {
  title: 'Monthly reports — State of Human Stress',
  description: 'Numbered monthly reports on civilizational stress across 25 countries. Each edition is frozen at publication.',
  alternates: { canonical: 'https://thehumanindex.org/reports' },
};

export const dynamic = 'force-static';

export default function ReportsIndex() {
  return (
    <div className="min-h-screen max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">Monthly reports</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">State of Human Stress</h1>
      <p className="mt-4 text-lg text-foreground-muted text-pretty">One numbered edition per month. Each is frozen at publication, so its numbers never change afterwards.</p>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {REPORTS.map(r => (
          <li key={r.period} className="py-4 flex justify-between gap-4">
            <Link href={`/reports/${r.period}`} className="font-serif text-xl hover:underline">{reportTitle(r)}</Link>
            <span className="text-sm text-foreground-subtle tabular-nums">No. {r.number}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
