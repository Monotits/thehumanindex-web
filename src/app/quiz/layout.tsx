import type { Metadata } from 'next'
import { WebApplicationJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Civilizational stress exposure — Personal assessment | The Human Index',
  description:
    'Five quick questions on where you live, what you do, and what worries you. We map your answers to our live indicators and surface the civilizational stresses that matter most for someone in your situation.',
  openGraph: {
    title: 'Civilizational stress exposure — The Human Index',
    description:
      'A 60-second personal stress profile against live country-level data across 5 meta-indexes.',
  },
  alternates: { canonical: 'https://thehumanindex.org/quiz' },
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <WebApplicationJsonLd />
      {children}
    </>
  )
}
