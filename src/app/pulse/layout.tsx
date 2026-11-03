import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekly Pulse — country stress briefings',
  description:
    'Weekly per-country briefings on civilizational stress, drafted with AI from The Human Index dataset and reviewed before publication.',
  openGraph: {
    title: 'Weekly Pulse — The Human Index',
    description:
      'Weekly per-country briefings on civilizational stress from The Human Index dataset.',
    url: 'https://thehumanindex.org/pulse',
  },
  alternates: { canonical: 'https://thehumanindex.org/pulse' },
}

export default function PulseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
