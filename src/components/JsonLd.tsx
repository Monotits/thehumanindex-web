export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Organization schema — site-wide
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'The Human Index',
        url: 'https://thehumanindex.org',
        logo: 'https://thehumanindex.org/logo-icon.svg',
        description:
          'Tracking civilization\'s proximity to irreversible AI-driven structural transformation across seven key domains.',
        sameAs: [],
      }}
    />
  )
}

// WebSite schema with SearchAction
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'The Human Index',
        url: 'https://thehumanindex.org',
        description:
          'Real-time civilizational stress tracker measuring AI displacement exposure across seven domains.',
      }}
    />
  )
}

// Article schema for Pulse posts
export function ArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
}: {
  title: string
  description: string
  slug: string
  publishedAt: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        url: `https://thehumanindex.org/pulse/${slug}`,
        datePublished: publishedAt,
        dateModified: publishedAt,
        author: {
          '@type': 'Organization',
          name: 'The Human Index',
        },
        publisher: {
          '@type': 'Organization',
          name: 'The Human Index',
          logo: {
            '@type': 'ImageObject',
            url: 'https://thehumanindex.org/logo-icon.svg',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://thehumanindex.org/pulse/${slug}`,
        },
      }}
    />
  )
}

// FAQPage schema for Methodology
export function FAQPageJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[]
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      }}
    />
  )
}

// WebApplication schema for Quiz
export function WebApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'AI Exposure Assessment Quiz',
        url: 'https://thehumanindex.org/quiz',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        description:
          'Free AI job displacement exposure assessment. Find out how vulnerable your career is to AI automation.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }}
    />
  )
}
