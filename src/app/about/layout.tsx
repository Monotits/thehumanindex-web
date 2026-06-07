import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'How we built it, what it measures, what it isn\'t. Five meta-indexes, 31 indicators, 25 countries — every score traceable to its source.',
  openGraph: {
    title: 'About — The Human Index',
    description:
      'A civilizational stress composite — economic, social, mental, technological, environmental — across 25 countries. Live, sourced, traceable.',
    url: 'https://thehumanindex.org/about',
  },
  alternates: {
    canonical: 'https://thehumanindex.org/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
