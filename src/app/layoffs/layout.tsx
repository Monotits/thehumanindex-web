import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Labor stress signals — Live layoff tracker',
  description:
    'Corporate layoff announcements from SEC EDGAR 8-K filings, California WARN notices and news reports — a standalone labor-stress signal feed from The Human Index.',
  openGraph: {
    title: 'Labor stress signals — The Human Index',
    description:
      'Where the labor market is breaking: layoff announcements from regulatory filings and news.',
    url: 'https://thehumanindex.org/layoffs',
  },
  alternates: {
    canonical: 'https://thehumanindex.org/layoffs',
  },
}

export default function LayoffsLayout({ children }: { children: React.ReactNode }) {
  return children
}
