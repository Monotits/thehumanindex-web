import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata = {
  title: 'About — The Human Index',
  description:
    'The Human Index is a civilizational stress scoreboard — 25 countries, 31 indicators, 5 meta-indexes. Built to make abstract pressures legible and traceable.',
  alternates: { canonical: 'https://thehumanindex.org/about' },
};

const COMPARES = [
  {
    name: 'Our World in Data',
    doing: 'Encyclopedia-style charts spanning every available dataset.',
    different:
      'We narrow to one question: how much civilizational stress is happening, right now, where you live? Composite, not catalog.',
  },
  {
    name: 'OECD Better Life Index',
    doing: 'Mid-decade wellbeing scoreboard, hand-curated by OECD economists.',
    different:
      'We update every 12 hours from public data and weight five domains. Editorial overlay in 10 languages explains what moved.',
  },
  {
    name: 'Trading Economics',
    doing: 'Live macro indicators table.',
    different:
      'We synthesize macro + social + mental + environmental indicators into one comparable score, with editorial context.',
  },
];

export default function AboutPage() {
  return (
    <article className="min-h-screen">
      {/* ── HERO ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
            About
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            Civilizational stress, made measurable.
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-foreground-muted text-pretty max-w-2xl leading-relaxed">
            We build the dashboard we wished existed: one number per country
            that tells you how stressed the place is, with the full audit trail
            below it.
          </p>
        </div>
      </header>

      {/* ── MISSION ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-thi">
          <h2>Mission</h2>
          <p>
            People feel that something is straining — economically, socially,
            mentally, environmentally — but the data lives in silos. Each
            indicator has its own home, its own lag, its own units. The result
            is that public conversation runs on vibes when it could run on
            comparable numbers.
          </p>
          <p>
            The Human Index turns that fragmented landscape into a single,
            comparable, drillable scoreboard. Twenty-five countries, thirty-one
            indicators, five meta-indexes, one composite. Every value traces
            back to its source.
          </p>

          <h2>What we do</h2>
          <ul>
            <li>
              Aggregate indicators from official sources — World Bank, Eurostat,
              IMF, OECD, WHO, NASA, Berkeley Earth, IHME, WRI, regulators —
              every 12 hours.
            </li>
            <li>
              Normalize each indicator to a 0–100 stress scale and combine into
              five meta-indexes using a published formula.
            </li>
            <li>
              Surface a weekly editorial layer (Pulse) per country in ten
              languages, and a long-form Research surface for deeper analyses.
            </li>
            <li>
              Make every number drillable to its raw value, reference date,
              source, and freshness.
            </li>
          </ul>

          <h2>What we don&apos;t do</h2>
          <ul>
            <li>
              We do not give clinical or policy advice. The composite is a
              scoreboard, not a diagnosis or a target.
            </li>
            <li>
              We do not invent data. Every indicator comes from a published
              source. When sources disagree, we show the disagreement.
            </li>
            <li>
              We do not personalize beyond country and locale. There is no
              behavioral profiling, no tracking-driven content shaping.
            </li>
          </ul>

          <h2>Who this is for</h2>
          <p>
            Journalists building stories that need comparable numbers.
            Researchers pulling cross-country signals. Policy teams looking for
            a quick orientation. Citizens trying to see where they actually
            stand. Anyone curious about whether things are as bad as they feel.
          </p>
        </div>
      </section>

      {/* ── COMPARES ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          How we&apos;re different
        </h2>
        <p className="text-foreground-muted mb-8 leading-relaxed">
          The Human Index occupies a specific niche between general-purpose
          data libraries and live macro tickers.
        </p>
        <ul className="divide-y divide-border border-y border-border">
          {COMPARES.map((c) => (
            <li key={c.name} className="py-5">
              <h3 className="font-serif text-lg font-semibold mb-1">{c.name}</h3>
              <p className="text-sm text-foreground-muted mb-2 leading-relaxed">
                <span className="text-foreground-subtle uppercase tracking-wider text-xs font-medium mr-2">
                  What they do
                </span>
                {c.doing}
              </p>
              <p className="text-sm text-foreground-muted leading-relaxed">
                <span className="text-foreground-subtle uppercase tracking-wider text-xs font-medium mr-2">
                  What we add
                </span>
                {c.different}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── PEOPLE / OPS ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          Who builds this
        </h2>
        <div className="prose prose-thi">
          <p>
            The Human Index is an independent project by{' '}
            <a href="https://umay.dev" target="_blank" rel="noopener noreferrer">
              Umay.dev
            </a>
            . The code is open source. The data ingestion runs on a public cron
            with publicly visible source health. The editorial layer is
            generated by Claude on top of validated data, then validated again
            before being published.
          </p>
          <p>
            If you spot a bad number, a missing source, or a misframing — please{' '}
            <Link href="/contact">get in touch</Link>. The credibility of this
            kind of project is built on whether we respond to corrections in
            public.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-foreground-muted max-w-md">
              Start anywhere — the rankings page is a fast overview, country
              pages are the detail level.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/rankings"
                className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                See the rankings
              </Link>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors"
              >
                Read the methodology
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
