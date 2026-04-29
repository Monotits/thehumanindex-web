import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Sources & Reliability — The Human Index',
  description:
    'Live operational status for every data source feeding The Human Index. Per-source uptime over the last 30 days, last successful fetch, and current health.',
  openGraph: {
    title: 'Data Sources & Reliability — The Human Index',
    description:
      'Transparency dashboard: which APIs are online, how often they succeed, and when they were last refreshed.',
  },
  alternates: { canonical: 'https://thehumanindex.org/data-sources' },
}

export default function DataSourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
