import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Inter, Newsreader, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { THEME_BOOTSTRAP_SCRIPT } from '@/components/ui/ThemeProvider'
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

// UI Sprint typography (per UI_Sprint_Plan_v1.md):
//  - Newsreader (Google) — editorial / serif headlines + article body
//  - Inter (Google)      — UI sans-serif (fallback for body)
//  - IBM Plex Mono       — tabular numeric figures
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
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
    // English-only. Per-locale hreflang URLs removed in Faz 13 wind-down —
    // they pointed at /tr, /de etc. routes that 404. Single canonical
    // URL = clean signal to Google. Re-add hreflang map only when
    // [locale] route group exists.
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
        {/* Preconnect to perf-critical third-party origins */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        {/* Pre-hydration theme bootstrap — prevents flash of incorrect theme */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${inter.variable} ${plexMono.variable} antialiased`}>
        <Providers>
          <OrganizationJsonLd />
          <WebSiteJsonLd />
          <DatasetJsonLd />
          <SiteHeader />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <SiteFooter />
        </Providers>
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
