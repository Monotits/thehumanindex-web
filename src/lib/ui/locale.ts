/**
 * Server-side locale helpers — read NEXT_LOCALE cookie in server components.
 *
 * Usage in a page.tsx:
 *   import { getActiveLocale } from '@/lib/ui/locale';
 *   const locale = await getActiveLocale();
 *   // pass to Supabase queries / API fetches
 */

import { cookies } from 'next/headers';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/config';

/**
 * Read NEXT_LOCALE cookie and return a validated Locale value.
 * Defaults to English when missing/invalid.
 */
export async function getActiveLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const raw = store.get('NEXT_LOCALE')?.value;
    if (raw && (LOCALES as readonly string[]).includes(raw)) {
      return raw as Locale;
    }
  } catch {
    // cookies() can throw if accessed outside a request scope
  }
  return DEFAULT_LOCALE;
}
