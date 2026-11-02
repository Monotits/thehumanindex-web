import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { anonClient, describeContributor, liveTone, LIVE_TONE_LABEL, LIVE_TONE_TEXT_CLASS, topDriver } from '@/lib/live/present';
import { loadReportData, REPORTS, reportTitle } from '@/lib/reports';
import { CHANGELOG } from '@/lib/changelog/entries';
import { CiteBox } from '@/components/cite/CiteBox';
import { BAND_LABELS, BAND_TEXT_CLASS, type StressBand } from '@/lib/ui/tokens';

export const revalidate = 86400;

export function generateStaticParams() {
  return REPORTS.map(r => ({ period: r.period }));
}

export async function generateMetadata({ params }: { params: Promise<{ period: string }> }): Promise<Metadata> {
  const { period } = await params;
  const r = REPORTS.find(x => x.period === period);
  if (!r) return {};
  return {
    title: `${reportTitle(r)} (No. ${r.number})`,
    description: `Monthly report No. ${r.number}: civilizational stress rankings for 25 countries, what moved, and what changed in the data.`,
    alternates: { canonical: `https://thehumanindex.org/reports/${r.period}` },
  };
}

export default async function ReportPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  const r = REPORTS.find(x => x.period === period);
  if (!r) notFound();
  const sb = await anonClient();
  const rows = sb ? await loadReportData(sb, r) : [];
  if (rows.length === 0) notFound();

  const n = rows.length;
  const avg = rows.reduce((a, x) => a + x.composite, 0) / n;
  const live = rows.filter(x => x.live !== null).sort((a, b) => b.live! - a.live!);
  const rising = live.slice(0, 5);
  const easing = live.slice(-3).reverse();
  const changes = CHANGELOG.filter(e => e.date.slice(0, 7) === r.period);
  const published = new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const [first, second, third] = rows;
  const calm = rows[n - 1];

  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
            Monthly report · No. {r.number} · {published} · methodology v{r.methodVersion}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-balance">{reportTitle(r)}</h1>
          <p className="mt-6 font-serif text-xl text-foreground-muted text-pretty leading-relaxed">
            {first.name} ({first.composite.toFixed(1)}), {second.name} ({second.composite.toFixed(1)}) and {third.name} ({third.composite.toFixed(1)})
            are the most stressed of the {n} countries we track; {calm.name} ({calm.composite.toFixed(1)}) is the least.
            The tracked-country average is {avg.toFixed(1)} on a 0–100 scale.
            {rising[0] && rising[0].live! > 60 && (
              <> Pressure is building fastest in {rising[0].name}
                {topDriver(rising[0].liveContributors) ? <> — {describeContributor(topDriver(rising[0].liveContributors)!).toLowerCase()}</> : null}.</>
            )}
          </p>
        </div>
      </section>

      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">Ranking</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-foreground-subtle border-b border-border">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Country</th>
                <th className="py-2 pr-3 font-medium text-right">Composite</th>
                <th className="py-2 pr-3 font-medium">Band</th>
                <th className="py-2 pr-3 font-medium text-right">Live</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x, i) => {
                const t = liveTone(x.live);
                const b = x.band as StressBand;
                return (
                  <tr key={x.code} className="border-b border-border">
                    <td className="py-2 pr-3 tabular-nums text-foreground-subtle">{i + 1}</td>
                    <td className="py-2 pr-3"><Link href={`/country/${x.code.toLowerCase()}`} className="hover:underline">{x.flag} {x.name}</Link></td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">{x.composite.toFixed(1)}</td>
                    <td className={`py-2 pr-3 ${BAND_TEXT_CLASS[b] ?? ''}`}>{BAND_LABELS[b] ?? x.band}</td>
                    <td className={`py-2 pr-3 text-right font-mono tabular-nums ${t ? LIVE_TONE_TEXT_CLASS[t] : 'text-foreground-subtle'}`}>{x.live === null ? '—' : x.live.toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-foreground-subtle">Composite: structural stress, 0–100. Live: recent momentum vs each country&apos;s own history, 50 = normal. Data frozen at {published}.</p>
      </section>

      {live.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">What moved</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[{ title: 'Rising pressure', list: rising }, { title: 'Easing', list: easing }].map(g => (
              <div key={g.title}>
                <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted mb-2">{g.title}</h3>
                <ul className="divide-y divide-border border-y border-border">
                  {g.list.map(x => {
                    const d = topDriver(x.liveContributors); const t = liveTone(x.live);
                    return (
                      <li key={x.code} className="py-2 flex justify-between gap-3">
                        <span><span className="font-medium">{x.flag} {x.name}</span>{d && <span className="block text-sm text-foreground-muted">{describeContributor(d)}</span>}</span>
                        <span className={`font-mono tabular-nums ${t ? LIVE_TONE_TEXT_CLASS[t] : ''}`}>{x.live!.toFixed(0)}{t && <span className="block text-[11px] text-foreground-subtle text-right">{LIVE_TONE_LABEL[t]}</span>}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {changes.length > 0 && (
        <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">What changed in the data this month</h2>
          <ul className="space-y-4">
            {changes.map(e => (
              <li key={e.title}>
                <div className="font-medium">{e.title}</div>
                {e.effect && <div className="text-sm text-foreground-muted">{e.effect}</div>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm"><Link href="/changelog" className="underline decoration-foreground-subtle/40 underline-offset-2">Full changelog</Link></p>
        </section>
      )}

      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <CiteBox title={`${reportTitle(r)} (Report No. ${r.number})`} url={`https://thehumanindex.org/reports/${r.period}`} accessed={r.publishedAt} />
        <p className="mt-4 text-sm text-foreground-muted">
          Data: <a href="/api/export?dataset=scores" className="underline decoration-foreground-subtle/40 underline-offset-2">latest scores (CSV)</a> ·{' '}
          <Link href="/methodology" className="underline decoration-foreground-subtle/40 underline-offset-2">methodology</Link> ·{' '}
          <Link href="/reports" className="underline decoration-foreground-subtle/40 underline-offset-2">all reports</Link>
        </p>
      </section>
    </div>
  );
}
