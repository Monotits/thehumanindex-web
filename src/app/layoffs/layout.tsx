import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Labor stress signals — Live layoff tracker | The Human Index',
  description:
    'Real-time corporate layoff signals from SEC EDGAR, WARN Act filings, and verified news — feeding the Economic meta-index in The Human Index civilizational stress framework.',
  openGraph: {
    title: 'Labor stress signals — The Human Index',
    description:
      'Where the labor market is breaking. Aggregated layoff signals contributing to the Economic meta-index.',
    url: 'https://thehumanindex.org/layoffs',
  },
  alternates: {
    canonical: 'https://thehumanindex.org/layoffs',
  },
}

export default function LayoffsLayout({ children }: { children: React.ReactNode }) {
  return children
}
