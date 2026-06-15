import createNextIntlPlugin from 'next-intl/plugin';

// Wraps Next.js config so next-intl can resolve src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // 301 redirects for retired routes — preserves SEO equity from
  // backlinks/social shares that point to old paths. After UI Sprint
  // Faz 4.1 the old 7-domain dashboard concepts are obsolete; the
  // closest new surfaces are /country/us (US-focused detail) and
  // /countries (multi-country index).
  async redirects() {
    // Retired locale prefixes (Faz 13 wind-down): The site used to advertise
    // 10 locales via next-intl. Per Buğra's call after observing 'UI says it
    // supports Turkish but most data is English', we wound the surface back
    // to English-only and the [locale] folder was never built out. Google
    // Search Console (2026-06-13) reports 404s + 'discovered not indexed'
    // for some of these legacy paths — Google still remembers them from
    // older crawls. 301-redirecting them to the canonical English path
    // preserves SEO equity from any inbound links AND tells Google
    // 'the URL moved here permanently' so the old ones eventually drop.
    //
    // The middleware in src/middleware.ts also matches /tr, /de, etc. but
    // returns 404 because there's no [locale] route group. These redirects
    // fire BEFORE middleware, so the matcher never sees them.
    const STALE_LOCALES = ['tr', 'de', 'es', 'fr', 'ja', 'pt-br', 'pl', 'it', 'nl'];
    const localeRedirects = STALE_LOCALES.flatMap((l) => [
      { source: `/${l}`,           destination: '/',         permanent: true },
      { source: `/${l}/:path*`,    destination: '/:path*',   permanent: true },
    ]);

    return [
      { source: '/dashboard',           destination: '/country/us', permanent: true },
      { source: '/dashboard/:path*',    destination: '/country/us', permanent: true },
      { source: '/global',              destination: '/countries',  permanent: true },
      { source: '/global/:path*',       destination: '/countries',  permanent: true },
      // /settings was a theme picker — ThemeToggle now lives in the
      // header, so the page is obsolete. Redirect to home.
      { source: '/settings',            destination: '/',           permanent: true },
      // /rankings was a separate page showing the same data as /countries
      // in a different layout. Merged into /countries with a view-mode
      // toggle in Faz 6.3. /rankings → /countries?view=table preserves
      // SEO equity and the analytical user's mental model.
      { source: '/rankings',            destination: '/countries?view=table', permanent: true },
      // Retired locale prefixes — see comment above.
      ...localeRedirects,
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
