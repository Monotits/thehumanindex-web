import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GLOSSARY, getGlossaryBySlug } from '@/lib/glossaryData'
import { FAQPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'
import Link from 'next/link'
import { ShareButton } from '@/components/share'
import type { DomainCardData } from '@/components/share'
import { Domain } from '@/lib/types'

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

      <div style={{ background: 'var(--thi-bg)', minHeight: '100vh', color: 'var(--thi-text)', fontFamily: 'var(--thi-font-body)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--thi-text-tertiary)', marginBottom: 32 }}>
            <Link href="/" style={{ color: 'var(--thi-text-tertiary)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/glossary" style={{ color: 'var(--thi-text-tertiary)', textDecoration: 'none' }}>Glossary</Link>
            <span>/</span>
            <span style={{ color: 'var(--thi-text-secondary)' }}>{entry.title}</span>
          </nav>

          {/* Header */}
          <header style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h1 style={{ fontSize: 32, fontWeight: 300, margin: 0, color: 'var(--thi-text)', fontFamily: 'var(--thi-font-heading)' }}>
                {entry.title}
              </h1>
              <ShareButton
                data={{
                  type: 'domain',
                  domain: entry.domain as Domain,
                  score: 0,
                  delta: null,
                  headline: entry.shortDescription,
                  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                } as DomainCardData}
                variant="compact"
                label="Share"
              />
            </div>
            <p style={{ fontSize: 16, color: 'var(--thi-text-secondary)', lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
              {entry.shortDescription}
            </p>
          </header>

          {/* What It Measures */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 16 }}>What It Measures</h2>
            <p style={{ fontSize: 15, color: 'var(--thi-text-secondary)', lineHeight: 1.7 }}>{entry.whatItMeasures}</p>
          </section>

          {/* Why It Matters */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 16 }}>Why It Matters</h2>
            <p style={{ fontSize: 15, color: 'var(--thi-text-secondary)', lineHeight: 1.7 }}>{entry.whyItMatters}</p>
          </section>

          {/* Data Sources */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 16 }}>Data Sources</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entry.dataSources.map((source, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: 'var(--thi-text-secondary)' }}>
                  <span style={{ color: 'var(--thi-accent)', marginTop: 6, fontSize: 8 }}>●</span>
                  <span>{source}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Methodology */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 16 }}>Methodology</h2>
            <p style={{ fontSize: 15, color: 'var(--thi-text-secondary)', lineHeight: 1.7 }}>{entry.methodology}</p>
          </section>

          {/* Correlations */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 16 }}>
              How It Connects to Other Domains
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {entry.correlations.map((c, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--thi-accent)', paddingLeft: 16 }}>
                  <p style={{ fontSize: 15, color: 'var(--thi-text-secondary)', lineHeight: 1.7, margin: 0 }}>{c}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Actionable Insights */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 24 }}>
              What You Can Do
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <InsightBlock title="For Individuals" items={entry.actionableInsights.individual} accent="var(--thi-accent)" />
              <InsightBlock title="For Policymakers" items={entry.actionableInsights.policymaker} accent="#f59e0b" />
              <InsightBlock title="For Businesses" items={entry.actionableInsights.business} accent="#3b82f6" />
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--thi-text)', marginBottom: 24 }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entry.faq.map((item, i) => (
                <details key={i} style={{ border: '1px solid var(--thi-surface-border)', borderRadius: 10, overflow: 'hidden' }}>
                  <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, cursor: 'pointer', fontSize: 15, fontWeight: 500, color: 'var(--thi-text)' }}>
                    {item.question}
                    <span style={{ color: 'var(--thi-text-tertiary)', fontSize: 18, flexShrink: 0, marginLeft: 16 }}>+</span>
                  </summary>
                  <div style={{ padding: '0 20px 20px' }}>
                    <p style={{ fontSize: 15, color: 'var(--thi-text-secondary)', lineHeight: 1.7, margin: 0 }}>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Cross-links */}
          <section style={{ borderTop: '1px solid var(--thi-surface-border)', paddingTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--thi-text)', marginBottom: 16 }}>Explore Other Domains</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {GLOSSARY.filter((g) => g.slug !== entry.slug).map((g) => (
                <Link
                  key={g.slug}
                  href={`/glossary/${g.slug}`}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--thi-surface-border)', fontSize: 13, color: 'var(--thi-text-secondary)', textDecoration: 'none' }}
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--thi-text-tertiary)', marginBottom: 16 }}>Want to see live data?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/dashboard" style={{ padding: '12px 24px', borderRadius: 10, background: 'var(--thi-accent)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                View Dashboard
              </Link>
              <Link href="/quiz" style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--thi-surface-border)', color: 'var(--thi-text-secondary)', fontSize: 14, textDecoration: 'none' }}>
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
    <div style={{ border: '1px solid var(--thi-surface-border)', borderRadius: 10, padding: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: accent, marginBottom: 16, margin: '0 0 16px' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: 'var(--thi-text-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontFamily: 'var(--thi-font-mono)', fontSize: 11, marginTop: 3, flexShrink: 0, color: accent }}>{String(i + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
