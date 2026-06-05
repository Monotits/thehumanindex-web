/**
 * next-intl server-side message loader.
 * Called by next-intl middleware + server components to resolve which
 * locale's translation file to load for the current request.
 *
 * Translation files live at src/i18n/messages/<locale>.json.
 * Missing files fall back to English silently.
 */

import { getRequestConfig } from 'next-intl/server';
import { LOCALES, DEFAULT_LOCALE, type Locale } from './config';

interface RequestConfigInput {
  requestLocale: Promise<string | undefined>;
}

export default getRequestConfig(async ({ requestLocale }: RequestConfigInput) => {
  const requested = await requestLocale;
  const locale: Locale = (LOCALES as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : DEFAULT_LOCALE;

  let messages = {};
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    // Fallback to English
    try {
      messages = (await import(`./messages/${DEFAULT_LOCALE}.json`)).default;
    } catch {
      messages = {};
    }
  }

  return { locale, messages };
});
