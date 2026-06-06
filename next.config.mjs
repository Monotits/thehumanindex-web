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
    return [
      { source: '/dashboard',           destination: '/country/us', permanent: true },
      { source: '/dashboard/:path*',    destination: '/country/us', permanent: true },
      { source: '/global',              destination: '/countries',  permanent: true },
      { source: '/global/:path*',       destination: '/countries',  permanent: true },
      // /settings was a theme picker — ThemeToggle now lives in the
      // header, so the page is obsolete. Redirect to home.
      { source: '/settings',            destination: '/',           permanent: true },
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
