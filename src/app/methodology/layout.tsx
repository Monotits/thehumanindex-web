import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology — How We Measure Civilizational Stress',
  description:
    'How we compute the composite — five meta-indexes (economic, social, mental, technological, environmental), 31 normalized indicators across 25 countries, every step documented.',
  openGraph: {
    title: 'Methodology — The Human Index',
    description:
      'The formula, the normalization, the weights, the freshness tiers, the fallback chain. Every choice we made, in the open.',
  },
  alternates: { canonical: 'https://thehumanindex.org/methodology' },
}

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
