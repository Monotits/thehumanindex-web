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
    // Per-locale homepage URLs. Next.js renders these as
    // <link rel="alternate" hreflang="X" href="..."/> in <head>. Combined with
    // the sitemap's hreflang block, this gives Google the strongest possible
    // signal that the site has 10 language variants of the homepage.
    //
    // For sub-pages, each route should override alternates.languages with its
    // own path via generateMetadata. Until UI sprint ships per-locale routes,
    // homepage-level signal is what we have.
    languages: {
      'en': 'https://thehumanindex.org/',
      'tr': 'https://thehumanindex.org/tr/',
      'de': 'https://thehumanindex.org/de/',
      'es': 'https://thehumanindex.org/es/',
      'fr': 'https://thehumanindex.org/fr/',
      'ja': 'https://thehumanindex.org/ja/',
      'pt-br': 'https://thehumanindex.org/pt-br/',
      'pl': 'https://thehumanindex.org/pl/',
      'it': 'https://thehumanindex.org/it/',
      'nl': 'https://thehumanindex.org/nl/',
      'x-default': 'https://thehumanindex.org/',
    },
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
