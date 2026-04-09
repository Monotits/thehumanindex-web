import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn how The Human Index tracks civilizational stress across seven domains — from AI job displacement to institutional trust — using real-time data from BLS, FRED, WHO, OECD, and more.',
  openGraph: {
    title: 'About — The Human Index',
    description:
      'How we measure civilizational stress across seven domains using live government and institutional data sources.',
    url: 'https://thehumanindex.org/about',
  },
  alternates: {
    canonical: 'https://thehumanindex.org/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
