import { MetadataRoute } from 'next'

const DOMAINS = [
  'ai-work-displacement',
  'income-inequality',
  'social-unrest',
  'institutional-decay',
  'social-wellbeing',
  'policy-response',
  'public-sentiment',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://thehumanindex.org'
  const now = new Date().toISOString()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/pulse`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/quiz`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/quiz/result`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/methodology`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const glossaryPages: MetadataRoute.Sitemap = DOMAINS.map((slug) => ({
    url: `${base}/glossary/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...glossaryPages]
}
