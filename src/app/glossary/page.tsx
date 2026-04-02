import { Metadata } from 'next'
import { GLOSSARY } from '@/lib/glossaryData'
import { BreadcrumbJsonLd } from '@/components/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Glossary — Understanding Every Domain',
  description:
    'Comprehensive guide to all seven domains of The Human Index: AI Work Displacement, Income Inequality, Social Unrest, Institutional Decay, Social Wellbeing, Policy Response, and Public Sentiment.',
  keywords: [
    'human index glossary',
    'civilizational stress domains',
    'AI displacement explained',
    'income inequality index',
    'social unrest tracker',
    'institutional decay measure',
  ],
  alternates: {
    canonical: 'https://thehumanindex.org/glossary',
  },
}

export default function GlossaryIndex() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://thehumanindex.org' },
          { name: 'Glossary', url: 'https://thehumanindex.org/glossary' },
        ]}
      />

      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Domain Glossary
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              The Human Index tracks civilizational stress across seven interconnected domains.
              Each domain is measured using real data from authoritative sources and normalized
              to a 0-100 stress scale. Explore each domain to understand what it measures,
              why it matters, and what you can do about it.
            </p>
          </header>

          <div className="grid gap-6">
            {GLOSSARY.map((entry) => (
              <Link
                key={entry.slug}
                href={`/glossary/${entry.slug}`}
                className="group block border border-[var(--border-primary)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
                      {entry.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      {entry.shortDescription}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {entry.dataSources.slice(0, 2).map((src, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                          {src.split('—')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors text-xl flex-shrink-0">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[var(--text-muted)] mb-4">See how these domains combine into one score</p>
            <Link
              href="/methodology"
              className="inline-block px-6 py-3 rounded-lg border border-[var(--accent)] text-[var(--accent)] font-medium hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              Read Our Methodology
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
