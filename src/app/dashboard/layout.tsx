import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Real-Time Civilizational Stress Monitor',
  description:
    'Live dashboard tracking AI displacement risk, income inequality, social unrest, and institutional stability across seven domains. Updated weekly.',
  openGraph: {
    title: 'Dashboard — The Human Index',
    description:
      'Real-time monitoring of civilization\'s structural stability. Composite score, domain breakdown, and historical trends.',
  },
  alternates: { canonical: 'https://thehumanindex.org/dashboard' },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
