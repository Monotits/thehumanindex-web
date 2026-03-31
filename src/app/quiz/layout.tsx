import type { Metadata } from 'next'
import { WebApplicationJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'AI Exposure Assessment Quiz — How Safe Is Your Job?',
  description:
    'Take the free AI displacement exposure quiz. Find out how vulnerable your job, skills, and region are to AI automation in under 3 minutes.',
  openGraph: {
    title: 'AI Exposure Assessment Quiz — The Human Index',
    description:
      'How exposed is your job to AI displacement? Take the free assessment quiz and get your personalized exposure score.',
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
