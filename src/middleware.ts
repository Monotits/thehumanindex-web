/**
 * Next.js middleware — i18n routing via next-intl.
 *
 * Strategy: as-needed prefix
 *   /               → en (English default, no prefix)
 *   /tr             → Turkish
 *   /de/dashboard   → German dashboard
 *
 * Existing English routes (/dashboard, /pulse, /layoffs, /global, etc.)
 * keep working untouched. Adding /tr/ in front activates Turkish messages
 * via next-intl's getRequestConfig.
 *
 * Routes excluded from middleware (no i18n redirect):
 *   - /api/*    (API endpoints stay flat)
 *   - /_next/*  (Next.js internals)
 *   - /static/* (assets)
 *   - files with extensions (.png, .ico, .xml, etc.)
 */

import createMiddleware from 'next-intl/middleware';
import { LOCALES, DEFAULT_LOCALE } from './i18n/config';

/**
 * NOTE: localeDetection disabled until per-locale [locale] route group
 * is built out. With detection on, Turkish/German/etc. browsers were
 * being redirected to /tr/countries etc. which 404 because we don't
 * have a [locale] folder in src/app/ yet. Default English remains the
 * only working surface for now.
 */
export default createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  localeDetection: false,
});

export const config = {
  matcher: [
    // Match all paths except internal Next.js paths, API, and static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
