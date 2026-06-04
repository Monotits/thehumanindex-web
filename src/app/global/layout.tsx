import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Global Dashboard — Country-Level Human Stress Index',
  description:
    'Multi-country composite stress scores across 25 nations. Five meta-indexes (Economic, Social, Mental, Technological, Environmental) covering 17 underlying indicators.',
  openGraph: {
    title: 'The Human Index — Global Dashboard',
    description:
      '25 countries, 5 meta-indexes, 17 indicators. See how nations compare on the new human stress framework.',
  },
  alternates: { canonical: 'https://thehumanindex.org/global' },
}

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
