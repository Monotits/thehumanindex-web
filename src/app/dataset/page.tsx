import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Human Index Dataset — API + CSV access | The Human Index',
  description:
    '25 countries, 31 indicators, 5 meta-indexes. Pipeline checks every 12 hours; underlying sources publish on their own cadence. Free programmatic access via REST API.',
  alternates: { canonical: 'https://thehumanindex.org/dataset' },
};

export const dynamic = 'force-static';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/data',
    description: 'Latest composite + 5 meta-index scores for all 25 countries.',
    sample: `curl https://thehumanindex.org/api/data`,
  },
  {
    method: 'GET',
    path: '/api/trends/[country]/[indicator]',
    description: 'Daily snapshots — up to 90 days for one (country, indicator) pair.',
    sample: `curl https://thehumanindex.org/api/trends/us/automation_exposure`,
  },
  {
    method: 'GET',
    path: '/api/transparency/[country]',
    description: 'Full sourcing audit for one country — every indicator, every adapter, divergence history.',
    sample: `curl https://thehumanindex.org/api/transparency/de`,
  },
  {
    method: 'GET',
    path: '/api/pulse',
    description: 'Latest weekly Pulse editorial entries, filterable by country and locale.',
    sample: `curl 'https://thehumanindex.org/api/pulse?locale=en&limit=20'`,
  },
  {
    method: 'GET',
    path: '/api/glossary',
    description: 'Glossary entries — terms, definitions, related indicators.',
    sample: `curl 'https://thehumanindex.org/api/glossary?locale=en'`,
  },
  {
    method: 'GET',
    path: '/api/research',
    description: 'Long-form research article listings, filterable by topic and meta-index.',
    sample: `curl 'https://thehumanindex.org/api/research?locale=en&meta=economic'`,
  },
];

const USE_CASES = [
  {
    title: 'For researchers',
    body: 'Cross-country panel data ready to import into R, Python, Stata or Julia. Daily granularity for trend studies; raw + normalized values both exposed.',
  },
  {
    title: 'For LLM training & retrieval',
    body: 'Structured, traceable signals with per-row source attribution. Designed to ground generation in cited public data, not hallucinated stats.',
  },
  {
    title: 'For journalists',
    body: 'Verified ranking inputs in seconds. Each endpoint response includes the publishing organization and reference date so citations are ready to paste.',
  },
  {
    title: 'For builders',
    body: 'JSON over HTTPS, no API key for read endpoints, edge-cached for 5 minutes. Drop-in for dashboards, alerting, derived analytics.',
  },
];

export default function DatasetPage() {
  return (
    <article className="min-h-screen">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Dataset
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              The Human Index Dataset.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl leading-relaxed">
              25 countries. 31 indicators. 5 meta-indexes. The pipeline checks
              every 12 hours; underlying sources publish on their own cadence.
              Every row traces back to a public statistical source.
              Free programmatic access for research, journalism, and AI
              applications.
            </p>
          </div>
        </div>
      </header>

      {/* ── STATS BAND ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Countries" value="25" caption="Across 6 continents" />
          <Stat label="Indicators" value="31" caption="Five meta-indexes" />
          <Stat label="Sources" value="10" caption="Public statistical bodies" />
          <Stat label="Pipeline check" value="12h" caption="Source cadence varies" />
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Who uses it
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          The dataset is designed for the people the rest of the site is not
          designed for — programmatic consumers.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {USE_CASES.map((u) => (
            <div key={u.title} className="rounded-lg border border-border bg-background p-5">
              <h3 className="font-serif text-lg font-semibold mb-2">{u.title}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{u.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENDPOINTS ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Endpoints
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          REST over HTTPS, JSON responses, edge-cached for 5 minutes. No API
          key required for read access. Rate limit: 10 requests per second per
          IP — generous enough for everything below batch ingestion.
        </p>
        <div className="space-y-4">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="rounded-lg border border-border bg-background p-5">
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span className="inline-flex items-center rounded-md bg-background-alt px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wide text-foreground-muted">
                  {e.method}
                </span>
                <code className="font-mono text-sm font-medium">{e.path}</code>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed mb-3">
                {e.description}
              </p>
              <pre className="text-xs font-mono bg-background-alt rounded p-3 overflow-x-auto">
                <code>{e.sample}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* ── ATTRIBUTION ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-4">
          License & attribution
        </h2>
        <div className="prose prose-thi">
          <p>
            The Human Index data is licensed under{' '}
            <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
              CC BY-NC 4.0
            </a>{' '}
            — free to use for non-commercial research, journalism, and AI
            applications, with attribution.
          </p>
          <p>
            <strong>Suggested citation:</strong> <em>The Human Index, retrieved
            from thehumanindex.org on YYYY-MM-DD.</em>
          </p>
          <p>
            The underlying sources retain their own licenses. Each indicator
            response includes the publishing organization and reference URL —
            if you redistribute raw numbers, attribute that source too.
          </p>
          <p>
            For commercial licensing, bulk export, custom feeds, or partnership
            inquiries — <Link href="/contact">get in touch</Link>.
          </p>
        </div>
      </section>

      {/* ── LINKS ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-serif text-lg font-semibold mb-4">
            See the data in context
          </h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/methodology"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Methodology
            </Link>
            <Link
              href="/transparency"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Source health
            </Link>
            <Link
              href="/data-sources"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Per-source uptime
            </Link>
            <Link
              href="/indicators"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Indicator catalog
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}

function Stat({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-2">{label}</div>
      <div className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold mb-1">{value}</div>
      <div className="text-xs text-foreground-muted">{caption}</div>
    </div>
  );
}
