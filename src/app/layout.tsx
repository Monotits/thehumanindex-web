import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'The Human Index — Civilizational Stress Tracker',
  description:
    'Track AI displacement exposure and civilizational stress across seven key domains. Understand your job risk, economic inequality, social unrest, institutional decay, and more.',
  openGraph: {
    title: 'The Human Index',
    description: 'Tracking civilization\'s proximity to irreversible AI-driven structural transformation',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Human Index',
    description: 'Civilizational Stress Tracker',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
