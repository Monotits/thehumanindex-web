import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Layoff Tracker',
  description:
    'Track AI-related layoffs across the tech industry and beyond. Real-time data on companies reducing headcount due to automation and AI adoption.',
  openGraph: {
    title: 'AI Layoff Tracker — The Human Index',
    description:
      'Real-time tracking of AI-driven workforce displacement across industries.',
    url: 'https://thehumanindex.org/layoffs',
  },
  alternates: {
    canonical: 'https://thehumanindex.org/layoffs',
  },
}

export default function LayoffsLayout({ children }: { children: React.ReactNode }) {
  return children
}
