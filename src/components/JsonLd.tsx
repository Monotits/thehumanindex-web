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

// Dataset schema — makes the index discoverable by AI models and Google Dataset Search
export function DatasetJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'The Human Index — Civilizational Stress Dataset',
        description:
          'Weekly composite index tracking civilizational stress across seven domains: AI Work Displacement, Income Inequality, Social Unrest, Institutional Decay, Social Wellbeing, Policy Response, and Public Sentiment. Data sourced from FRED, World Bank, ACLED, GDELT, and OECD.',
        url: 'https://thehumanindex.org',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: {
          '@type': 'Organization',
          name: 'The Human Index',
          url: 'https://thehumanindex.org',
        },
        temporalCoverage: '2024/..',
        spatialCoverage: {
          '@type': 'Place',
          name: 'Global (focus: United States)',
        },
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Composite Stress Index', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'AI Work Displacement', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Income Inequality', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Social Unrest', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Institutional Decay', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Social Wellbeing', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Policy Response', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Public Sentiment', unitText: 'score 0-100' },
        ],
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: 'https://thehumanindex.org/api/data',
        },
        keywords: [
          'civilizational stress',
          'AI displacement',
          'economic inequality',
          'social unrest',
          'institutional decay',
          'public sentiment',
          'composite index',
          'weekly tracker',
        ],
      }}
    />
  )
}

// BreadcrumbList schema
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  )
}
