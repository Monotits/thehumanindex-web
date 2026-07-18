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
          'A daily-refreshed civilizational stress index tracking 25 countries across 31 indicators grouped into five meta-indexes: economic, social, mental, technological, environmental.',
        sameAs: [],
      }}
    />
  )
}

// WebSite schema
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'The Human Index',
        url: 'https://thehumanindex.org',
        description:
          'A civilizational stress composite across 25 countries and 31 indicators, grouped into five meta-indexes: economic, social, mental, technological, environmental.',
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
          'Civilizational stress composite across 25 countries and 31 indicators, grouped into five meta-indexes (economic, social, mental, technological, environmental). Sourced from World Bank, Eurostat, IMF WEO, OECD, WHO, NASA GISS, Berkeley Earth, IHME GBD, WRI Aqueduct, and Gallup.',
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
          name: 'Global — 25 countries',
        },
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Composite Stress Index', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Economic Stress Meta-Index', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Social Stress Meta-Index', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Mental Stress Meta-Index', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Technological Stress Meta-Index', unitText: 'score 0-100' },
          { '@type': 'PropertyValue', name: 'Environmental Stress Meta-Index', unitText: 'score 0-100' },
        ],
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: 'https://thehumanindex.org/api/data',
        },
        keywords: [
          'human stress index',
          'country stress rankings',
          'economic stress',
          'social stress',
          'mental health statistics',
          'technological stress',
          'environmental stress',
          'composite index',
          'open dataset',
          'daily tracker',
        ],
      }}
    />
  )
}

// DefinedTerm schema — glossary entries (ideal for answer-engine extraction)
export function DefinedTermJsonLd({
  term,
  definition,
  slug,
}: {
  term: string
  definition: string
  slug: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: term,
        description: definition,
        url: `https://thehumanindex.org/glossary/${slug}`,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'The Human Index Glossary',
          url: 'https://thehumanindex.org/glossary',
        },
      }}
    />
  )
}

// ItemList schema — top-10 ranking pages
export function ItemListJsonLd({
  name,
  url,
  items,
}: {
  name: string
  url: string
  items: { name: string; url?: string }[]
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        url,
        numberOfItems: items.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          ...(item.url ? { url: item.url } : {}),
        })),
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
