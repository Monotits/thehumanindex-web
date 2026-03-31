import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekly Pulse — AI Displacement Analysis & Insights',
  description:
    'Weekly analysis of AI displacement trends, economic shifts, and civilizational stress indicators. Expert commentary on the forces reshaping work and society.',
  openGraph: {
    title: 'Weekly Pulse — The Human Index',
    description:
      'Weekly deep-dive analysis into AI displacement, economic inequality, and civilizational stress trends.',
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
