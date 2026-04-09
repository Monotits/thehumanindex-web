import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { OrganizationJsonLd, WebSiteJsonLd, DatasetJsonLd } from '@/components/JsonLd'
import { Providers } from '@/components/Providers'
import { Analytics } from '@vercel/analytics/react'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

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
  metadataBase: new URL('https://thehumanindex.org'),
  title: {
    default: 'The Human Index — Civilizational Stress Tracker',
    template: '%s | The Human Index',
  },
  description:
    'Track AI displacement exposure and civilizational stress across seven key domains. Understand your job risk, economic inequality, social unrest, institutional decay, and more.',
  keywords: [
    'AI displacement',
    'civilizational stress',
    'job automation risk',
    'AI exposure index',
    'human index',
    'AI job impact',
    'economic inequality',
    'social unrest tracker',
    'institutional decay',
    'AI workforce disruption',
  ],
  authors: [{ name: 'The Human Index' }],
  creator: 'The Human Index',
  publisher: 'The Human Index',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/logo-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Human Index — Civilizational Stress Tracker',
    description: 'Real-time tracking of civilization\'s proximity to irreversible AI-driven structural transformation across seven key domains.',
    type: 'website',
    siteName: 'The Human Index',
    locale: 'en_US',
    url: 'https://thehumanindex.org',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Human Index — Civilizational Stress Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Human Index — Civilizational Stress Tracker',
    description: 'Real-time tracking of AI displacement exposure across seven key domains.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://thehumanindex.org',
    types: {
      'application/rss+xml': 'https://thehumanindex.org/feed.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="iLceQwDotiKddHWJtUP3iatXZEtY9e0l789bQonpBWw" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Inline script to prevent theme flash — runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('thi-theme');var c=localStorage.getItem('thi-theme-chosen');if(t==='briefing'){document.body.style.background='#fafaf8';document.body.style.color='#1a1a1a';document.body.setAttribute('data-theme','briefing')}else if(t==='terminal'){document.body.style.background='#0a0a0a';document.body.style.color='#e0e0e0';document.body.setAttribute('data-theme','terminal')}else{document.body.style.background='#0a0a0a';document.body.style.color='#e0e0e0';document.body.setAttribute('data-theme','signal')}if(c!=='true'){document.body.setAttribute('data-theme-pending','true')}}catch(e){}})()`,
          }}
        />
        <Providers>
          <OrganizationJsonLd />
          <WebSiteJsonLd />
          <DatasetJsonLd />
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
