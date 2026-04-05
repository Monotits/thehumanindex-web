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

      <div style={{ background: 'var(--thi-bg)', minHeight: '100vh', color: 'var(--thi-text)', fontFamily: 'var(--thi-font-body)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
          <header style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 32, fontWeight: 300, margin: '0 0 16px', color: 'var(--thi-text)', fontFamily: 'var(--thi-font-heading)' }}>
              Domain Glossary
            </h1>
            <p style={{ fontSize: 16, color: 'var(--thi-text-secondary)', lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
              The Human Index tracks civilizational stress across seven interconnected domains.
              Each domain is measured using real data from authoritative sources and normalized
              to a 0-100 stress scale. Explore each domain to understand what it measures,
              why it matters, and what you can do about it.
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {GLOSSARY.map((entry) => (
              <Link
                key={entry.slug}
                href={`/glossary/${entry.slug}`}
                style={{ display: 'block', border: '1px solid var(--thi-surface-border)', borderRadius: 10, padding: 24, textDecoration: 'none', transition: 'border-color 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--thi-text)', marginBottom: 8, margin: '0 0 8px' }}>
                      {entry.title}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--thi-text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                      {entry.shortDescription}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {entry.dataSources.slice(0, 2).map((src, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--thi-surface)', color: 'var(--thi-text-tertiary)' }}>
                          {src.split('—')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ color: 'var(--thi-text-tertiary)', fontSize: 18, flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--thi-text-tertiary)', marginBottom: 16 }}>See how these domains combine into one score</p>
            <Link
              href="/methodology"
              style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, border: '1px solid var(--thi-surface-border)', color: 'var(--thi-text-secondary)', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}
            >
              Read Our Methodology
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
