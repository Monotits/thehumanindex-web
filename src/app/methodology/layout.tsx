import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology — How We Measure Civilizational Stress',
  description:
    'Learn how The Human Index measures AI displacement risk across seven domains: work risk, inequality, unrest, institutional decay, wellbeing, policy response, and public sentiment.',
  openGraph: {
    title: 'Methodology — The Human Index',
    description:
      'Transparent methodology behind the civilizational stress index. Seven domains, weighted composite scoring, updated weekly.',
  },
  alternates: { canonical: 'https://thehumanindex.org/methodology' },
}

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
