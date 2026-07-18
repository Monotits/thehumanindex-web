import Link from 'next/link';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { StressBand } from '@/components/ui/StressBand';
import {
  META_INDEXES,
  META_LABELS,
  META_WEIGHT,
  BAND_LABELS,
  type StressBand as Band,
} from '@/lib/ui/tokens';
import { FAQPageJsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';

const BAND_BOUNDS: { band: Band; min: number; max: number; description: string }[] = [
  { band: 'low',      min: 0,  max: 25, description: 'Functional society — stressors present but bounded' },
  { band: 'moderate', min: 26, max: 45, description: 'Strain visible in headline indicators' },
  { band: 'elevated', min: 46, max: 65, description: 'Recurring strain across multiple meta-indexes' },
  { band: 'high',     min: 66, max: 80, description: 'Acute stress; institutional buffer eroding' },
  { band: 'critical', min: 81, max: 100, description: 'Sustained crisis-level signals' },
];

const FRESHNESS_TIERS = [
  { tier: 'Fresh',      window: 'within 2 years',  status: 'Counts at full weight' },
  { tier: 'Aging',      window: '2 to 3 years',    status: 'Counts at full weight, visibly tagged' },
  { tier: 'Stale',      window: '3 to 5 years',    status: 'Counts with downweight + warning' },
  { tier: 'Very stale', window: 'over 5 years',    status: 'Excluded or held until refresh' },
];

const CONFIDENCE_TIERS = [
  { tier: 'Verified', when: 'Filed with a regulator or official statistical agency (SEC EDGAR, WARN Act, World Bank, Eurostat, IMF, OECD)' },
  { tier: 'Reported', when: 'Wire service or established news outlet, single source' },
  { tier: 'Rumored',  when: 'Tracked but not surfaced to scores until corroborated' },
];

export const metadata = {
  title: 'Methodology — How the composite is computed | The Human Index',
  description:
    'How The Human Index turns 31 indicators across 25 countries into a single composite stress score. Sources, normalization, weights, fallback chain, freshness tiers, confidence tiers — all of it.',
  alternates: { canonical: 'https://thehumanindex.org/methodology' },
  openGraph: {
    title: 'Methodology — How the composite is computed',
    description:
      'The formula, the normalization, the weights, the freshness tiers, the fallback chain. Every choice we made, in the open.',
    url: 'https://thehumanindex.org/methodology',
    type: 'website',
    siteName: 'The Human Index',
  },
};

function weightRationale(meta: string): string {
  switch (meta) {
    case 'economic':
      return 'Felt first — income, jobs, housing are the most immediate pressure surface.';
    case 'social':
      return 'Sustained communal trust and cohesion underpin every other meta.';
    case 'mental':
      return 'Population-level mental load — anxiety, suicide, loneliness — measured separately from economic stress.';
    case 'technological':
      return 'Automation exposure and digital displacement are real but slower to translate into lived stress.';
    case 'environmental':
      return 'Accumulates over decades; weighted lowest only because year-on-year movement is slow.';
    default:
      return '';
  }
}

const FAQ_ITEMS = [
  {
    question: 'What is The Human Index composite score?',
    answer:
      'A 0-100 stress score per country, computed as the weighted average of five meta-indexes (economic, social, mental, technological, environmental), each built from normalized indicators sourced from official statistics.',
  },
  {
    question: 'What do the score bands mean?',
    answer: BAND_BOUNDS.map((b) => `${b.min}-${b.max} ${BAND_LABELS[b.band]}: ${b.description}`).join('. ') + '.',
  },
  {
    question: 'How fresh is the data?',
    answer:
      'The pipeline re-checks sources every 12 hours. Each data point carries a freshness tier: fresh (within 2 years) counts at full weight; aging (2-3 years) is tagged; stale (3-5 years) is downweighted with a warning; very stale (5+ years) is excluded until refreshed.',
  },
  {
    question: 'How are indicators normalized?',
    answer:
      'Each raw value is mapped onto a 0-100 stress scale between documented low/high bounds specific to that indicator, inverting where a higher raw value means less stress. The bounds and direction are published for every indicator.',
  },
  {
    question: 'Can I use the data?',
    answer:
      'Yes — the dataset is open under CC-BY-4.0. Machine-readable access is available via the public API and the dataset page. Cite "The Human Index (thehumanindex.org)".',
  },
];

export default function MethodologyPage() {
  return (
    <article className="min-h-screen">
      <FAQPageJsonLd questions={FAQ_ITEMS} />
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
            Methodology
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            How we compute civilizational stress.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl leading-relaxed">
            Every score is the output of a published formula running over
            sourced indicators. Below is the formula, the inputs, and the
            choices we made — including the ones that could reasonably go
            another way.
          </p>
        </div>
      </header>

      {/* ── SHAPE OF THE INDEX ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          The shape of the index
        </h2>
        <div className="prose prose-thi">
          <p>
            For every country we track, on every cron run, the system produces:
          </p>
          <ul>
            <li>A normalized score for each of <strong>31 indicators</strong> on a 0–100 stress scale (lower means less stress).</li>
            <li>A score for each of <strong>5 meta-indexes</strong>, averaged from its constituent indicators.</li>
            <li>One <strong>composite</strong> score per country, a weighted average of the 5 meta-indexes.</li>
          </ul>
          <p>
            Everything else on the site — Pulse, Research, Glossary, Country
            detail pages — reads from those three layers.
          </p>
        </div>
      </section>

      {/* ── FORMULA ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          The composite formula
        </h2>
        <p className="text-foreground-muted mb-8 leading-relaxed">
          The composite is a weighted average of the five meta-indexes. The
          weights below were chosen to reflect how immediately each domain
          shows up in daily life — economic stress hits first, environmental
          stress accumulates last.
        </p>

        <div className="rounded-lg border border-border bg-background-alt/30 p-6 mb-6">
          <code className="block font-mono text-sm text-foreground-muted">
            composite = 0.25·economic + 0.20·social + 0.20·mental + 0.20·technological + 0.15·environmental
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-strong text-xs uppercase tracking-wider text-foreground-muted">
                <th className="text-left py-3 pr-3 font-medium">Meta-index</th>
                <th className="text-right py-3 pr-3 font-medium">Weight</th>
                <th className="text-left py-3 pr-3 font-medium">Why this weight</th>
              </tr>
            </thead>
            <tbody>
              {META_INDEXES.map((m) => (
                <tr key={m} className="border-b border-border">
                  <td className="py-3 pr-3">
                    <MetaCategoryBadge meta={m} variant="dot" size="md" />
                  </td>
                  <td className="py-3 pr-3 text-right font-mono tabular-nums font-semibold">
                    {Math.round(META_WEIGHT[m] * 100)}%
                  </td>
                  <td className="py-3 pr-3 text-foreground-muted">
                    {weightRationale(m)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-border-strong">
                <td className="py-3 pr-3 font-medium">Total</td>
                <td className="py-3 pr-3 text-right font-mono tabular-nums font-semibold">
                  100%
                </td>
                <td className="py-3 pr-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── INDICATOR NORMALIZATION ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          From raw measurement to stress score
        </h2>
        <div className="prose prose-thi">
          <p>
            Each indicator has its own native unit — Gini coefficient, GDP per
            capita, temperature anomaly °C, suicide rate per 100k. To make them
            comparable, we map each to a 0–100 stress scale using fixed bounds
            that are documented in the source code per indicator.
          </p>
          <ul>
            <li>
              <strong>Stress-positive indicators</strong> (higher = worse, e.g.
              unemployment, homicide rate, temperature anomaly): mapped linearly
              between a low-stress bound and a high-stress bound.
            </li>
            <li>
              <strong>Stress-negative indicators</strong> (higher = better, e.g.
              life expectancy, life satisfaction): inverted so the resulting
              score still aligns with the stress direction.
            </li>
            <li>
              Bounds are reviewed periodically as part of the normalization
              sanity sweep audits.
            </li>
          </ul>
        </div>
      </section>

      {/* ── BAND THRESHOLDS ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          Stress bands
        </h2>
        <p className="text-foreground-muted mb-8 leading-relaxed">
          Score bands convert continuous numbers into editorial categories.
          They are calibrated so that what we have actually been measuring
          across 25 countries spreads roughly evenly across the lower four
          bands, with the critical band reserved for genuinely uncommon
          situations.
        </p>

        <ul className="divide-y divide-border border-y border-border">
          {BAND_BOUNDS.map((b) => (
            <li key={b.band} className="py-4 flex items-center gap-4 flex-wrap">
              <div className="w-28 shrink-0">
                <StressBand band={b.band} score={null} showScore={false} variant="pill" size="md" />
              </div>
              <div className="font-mono tabular-nums text-sm text-foreground-muted w-20 shrink-0">
                {b.min} – {b.max}
              </div>
              <div className="flex-1 text-sm text-foreground-muted">
                {b.description}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── FRESHNESS + CONFIDENCE ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          Freshness and confidence
        </h2>
        <p className="text-foreground-muted mb-8 leading-relaxed">
          Not all data points are equal. Two visible signals tell you how much
          to trust any given number on the site.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">
              Freshness
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              How recently the underlying observation was made.
            </p>
            <ul className="space-y-3 text-sm">
              {FRESHNESS_TIERS.map((t) => (
                <li key={t.tier}>
                  <span className="font-mono text-xs uppercase tracking-wide text-foreground">
                    {t.tier}
                  </span>
                  <span className="text-foreground-muted"> — {t.window}.</span>
                  <span className="text-foreground-subtle"> {t.status}.</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">
              Confidence
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              Where the data point came from determines how it is used.
            </p>
            <ul className="space-y-3 text-sm">
              {CONFIDENCE_TIERS.map((t) => (
                <li key={t.tier}>
                  <span className="font-mono text-xs uppercase tracking-wide text-foreground">
                    {t.tier}
                  </span>
                  <span className="text-foreground-muted"> — {t.when}.</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FALLBACK CHAIN ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          When multiple sources publish the same indicator
        </h2>
        <div className="prose prose-thi">
          <p>
            For indicators with more than one independent source (e.g. inflation
            from IMF WEO and World Bank, temperature from NASA GISS and Berkeley
            Earth), the orchestrator does three things on every cron run:
          </p>
          <ol>
            <li>
              <strong>Compare</strong> the latest reading from each adapter. If
              they agree within a per-indicator threshold, the primary source
              wins.
            </li>
            <li>
              <strong>Flag</strong> any divergence that exceeds the threshold.
              The divergence is recorded and visible on{' '}
              <Link href="/transparency">the transparency dashboard</Link> —
              we never silently pick a side without leaving a record.
            </li>
            <li>
              <strong>Fall back</strong> to the next available source if the
              primary fails, so the country&apos;s composite continues to update
              even during an outage.
            </li>
          </ol>
        </div>
      </section>

      {/* ── WHAT THIS IS NOT ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          What this is — and is not
        </h2>
        <div className="prose prose-thi">
          <p>
            The Human Index is a <strong>directional, peer-comparable</strong> stress
            scoreboard. It is intended for editorial framing, prioritization, and
            longitudinal comparison.
          </p>
          <p>
            It is <strong>not</strong> a clinical instrument, not a policy
            optimization target, not a substitute for the original sources. The
            absolute number means less than its movement over time and relative
            to peers.
          </p>
        </div>
      </section>

      {/* ── LINKS ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-serif text-lg font-semibold mb-4">
            See it in the open
          </h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/transparency"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Transparency dashboard
            </Link>
            <Link
              href="/data-sources"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Source health per source
            </Link>
            <Link
              href="/glossary"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Indicator glossary
            </Link>
          </div>
        </div>
      </section>

      {/* Suppress unused imports (Turkish band labels reserved) */}
      {void BAND_LABELS as unknown as null}
      {void META_LABELS as unknown as null}
    </article>
  );
}
