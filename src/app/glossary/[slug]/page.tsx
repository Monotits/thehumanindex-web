import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GLOSSARY, getGlossaryBySlug } from '@/lib/glossaryData'
import { FAQPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'
import Link from 'next/link'

// Generate static paths for all glossary entries
export function generateStaticParams() {
  return GLOSSARY.map((entry) => ({ slug: entry.slug }))
}

// Dynamic metadata for SEO
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const entry = getGlossaryBySlug(params.slug)
  if (!entry) return { title: 'Not Found' }

  return {
    title: `${entry.title} — What It Means & Why It Matters`,
    description: entry.shortDescription,
    keywords: [
      entry.title.toLowerCase(),
      `${entry.title.toLowerCase()} index`,
      `${entry.title.toLowerCase()} score`,
      'civilizational stress',
      'human index',
      'AI impact',
    ],
    alternates: {
      canonical: `https://thehumanindex.org/glossary/${entry.slug}`,
    },
    openGraph: {
      title: `${entry.title} — The Human Index`,
      description: entry.shortDescription,
      url: `https://thehumanindex.org/glossary/${entry.slug}`,
      type: 'article',
    },
  }
}

export default function GlossaryPage({ params }: { params: { slug: string } }) {
  const entry = getGlossaryBySlug(params.slug)
  if (!entry) notFound()

  return (
    <>
      <FAQPageJsonLd questions={entry.faq} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://thehumanindex.org' },
          { name: 'Glossary', url: 'https://thehumanindex.org/glossary' },
          { name: entry.title, url: `https://thehumanindex.org/glossary/${entry.slug}` },
        ]}
      />

      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/glossary" className="hover:text-[var(--accent)] transition-colors">Glossary</Link>
            <span>/</span>
            <span className="text-[var(--text-secondary)]">{entry.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              {entry.title}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              {entry.shortDescription}
            </p>
          </header>

          {/* What It Measures */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">What It Measures</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{entry.whatItMeasures}</p>
          </section>

          {/* Why It Matters */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Why It Matters</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{entry.whyItMatters}</p>
          </section>

          {/* Data Sources */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data Sources</h2>
            <ul className="space-y-2">
              {entry.dataSources.map((source, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                  <span className="text-[var(--accent)] mt-1.5 text-xs">●</span>
                  <span>{source}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Methodology */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Methodology</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{entry.methodology}</p>
          </section>

          {/* Correlations */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              How It Connects to Other Domains
            </h2>
            <div className="space-y-4">
              {entry.correlations.map((c, i) => (
                <div key={i} className="border-l-2 border-[var(--accent)] pl-4">
                  <p className="text-[var(--text-secondary)] leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Actionable Insights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
              What You Can Do
            </h2>

            <div className="grid md:grid-cols-1 gap-6">
              <InsightBlock
                title="For Individuals"
                items={entry.actionableInsights.individual}
                accent="var(--accent)"
              />
              <InsightBlock
                title="For Policymakers"
                items={entry.actionableInsights.policymaker}
                accent="var(--score-elevated)"
              />
              <InsightBlock
                title="For Businesses"
                items={entry.actionableInsights.business}
                accent="var(--score-moderate)"
              />
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {entry.faq.map((item, i) => (
                <details key={i} className="group border border-[var(--border-primary)] rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                    <h3 className="text-lg font-medium text-[var(--text-primary)] pr-4">{item.question}</h3>
                    <span className="text-[var(--text-muted)] group-open:rotate-45 transition-transform text-xl flex-shrink-0">+</span>
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-[var(--text-secondary)] leading-relaxed">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Cross-links */}
          <section className="border-t border-[var(--border-primary)] pt-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Explore Other Domains</h2>
            <div className="flex flex-wrap gap-3">
              {GLOSSARY.filter((g) => g.slug !== entry.slug).map((g) => (
                <Link
                  key={g.slug}
                  href={`/glossary/${g.slug}`}
                  className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-[var(--text-muted)] mb-4">Want to see live data?</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                View Dashboard
              </Link>
              <Link
                href="/quiz"
                className="px-6 py-3 rounded-lg border border-[var(--accent)] text-[var(--accent)] font-medium hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                Take the AI Exposure Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InsightBlock({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ color: accent }}>
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)] text-sm leading-relaxed">
            <span className="font-mono text-xs mt-0.5 flex-shrink-0" style={{ color: accent }}>{String(i + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
