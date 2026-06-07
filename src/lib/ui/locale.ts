/**
 * Locale helpers — currently English-only.
 *
 * The site was originally built with cookie-driven 10-locale content
 * fetching (Faz 3.1). After traffic analysis showed near-zero
 * non-English search demand and brand voice constraints favoured a
 * single-language editorial register, we collapsed to English-only.
 *
 * This module stays in place as the central locale entry point so we
 * can flip it back on later without touching every consumer. Every
 * page that calls getActiveLocale() will simply receive 'en' for now;
 * if we re-enable multi-locale fetching, this function changes and
 * everything downstream still works.
 *
 * The next-intl messages files (src/i18n/messages/) and middleware
 * are kept dormant — they're cheap to maintain and ready when needed.
 */

import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

/**
 * Returns the active locale for content fetching.
 *
 * Pinned to English ('en') until traffic data justifies re-enabling
 * the cookie-driven multi-locale path.
 */
export async function getActiveLocale(): Promise<Locale> {
  return DEFAULT_LOCALE;
}
