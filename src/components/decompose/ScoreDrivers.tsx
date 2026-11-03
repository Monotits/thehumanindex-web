import Link from 'next/link';
import type { Gap } from '@/lib/decompose';

interface Props {
  countryName: string;
  composite: number;
  avgComposite: number;
  gaps: Gap[];
  names: Record<string, string>;
  /** Share of the composite from annual survey/report indicators. */
  seed?: { share: number; minYear: number | null; maxYear: number | null } | null;
}

/** "Why is X above/below average?" — per-indicator gaps that sum exactly to the difference. */
export function ScoreDrivers({ countryName, composite, avgComposite, gaps, names, seed }: Props) {
  const diff = composite - avgComposite;
  // Missing data is not a driver: a country without a value would otherwise
  // show that indicator as "holding the score down".
  const up = gaps.filter(g => !g.missing && g.gap > 0.05).sort((a, b) => b.gap - a.gap).slice(0, 5);
  const down = gaps.filter(g => !g.missing && g.gap < -0.05).sort((a, b) => a.gap - b.gap).slice(0, 5);
  const missing = gaps.filter(g => g.missing).length;
  const max = Math.max(0.5, ...[...up, ...down].map(g => Math.abs(g.gap)));
  const shown = [...up, ...down].reduce((a, g) => a + g.gap, 0);

  const Bar = ({ g }: { g: Gap }) => (
    <li className="grid grid-cols-12 gap-3 items-center py-2">
      <span className="col-span-5 text-sm truncate" title={names[g.indicatorId] ?? g.indicatorId}>{names[g.indicatorId] ?? g.indicatorId}</span>
      <span className="col-span-5 h-2 rounded-full bg-background-alt relative" aria-hidden="true">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${(Math.abs(g.gap) / max) * 100}%`, backgroundColor: g.gap > 0 ? 'var(--band-high)' : 'var(--band-low)' }}
        />
      </span>
      <span className="col-span-2 text-right font-mono tabular-nums text-sm">{g.gap > 0 ? '+' : '−'}{Math.abs(g.gap).toFixed(1)}</span>
    </li>
  );

  return (
    <section id="drivers" className="scroll-mt-24">
      <div className="mb-6 max-w-2xl">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">What drives the score</h2>
        <p className="text-foreground-muted text-pretty">
          {countryName} scores {composite.toFixed(1)}, {Math.abs(diff).toFixed(1)} points {diff >= 0 ? 'above' : 'below'} the
          tracked-country average of {avgComposite.toFixed(1)}. Each bar is one indicator&apos;s share of that gap, in composite
          points; all indicators together add up to it (± rounding).
          {missing > 0 && <> {missing === 1 ? 'One indicator has' : `${missing} indicators have`} no value for {countryName}; their weight goes to the others, so they are not listed.</>}
        </p>
        {seed && seed.share > 0 && (
          <p className="mt-3 text-sm text-foreground-muted text-pretty border-l-2 border-border pl-3">
            About <strong>{Math.round(seed.share * 100)}%</strong> of this score comes from annual surveys and reports
            {seed.minYear && seed.maxYear ? <> (editions {seed.minYear === seed.maxYear ? seed.minYear : `${seed.minYear}–${seed.maxYear}`})</> : null}.
            These move at most once a year; the <Link href="#live" className="underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground">Live layer</Link> shows
            what changed recently. <Link href="/data-sources#editions" className="underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground">Which editions we use</Link>.
          </p>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted mb-2">Pushing it up</h3>
          {up.length ? <ul className="divide-y divide-border border-y border-border">{up.map(g => <Bar key={g.indicatorId} g={g} />)}</ul>
            : <p className="text-sm text-foreground-muted">No indicator is meaningfully above average.</p>}
        </div>
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted mb-2">Holding it down</h3>
          {down.length ? <ul className="divide-y divide-border border-y border-border">{down.map(g => <Bar key={g.indicatorId} g={g} />)}</ul>
            : <p className="text-sm text-foreground-muted">No indicator is meaningfully below average.</p>}
        </div>
      </div>
      <p className="mt-3 text-xs text-foreground-subtle">
        Shown: {shown >= 0 ? '+' : '−'}{Math.abs(shown).toFixed(1)} of {diff >= 0 ? '+' : '−'}{Math.abs(diff).toFixed(1)} points; the rest is spread across smaller indicators.
      </p>
    </section>
  );
}
