/**
 * i18n routing configuration
 *
 * Supported locales:
 *   en   — English (default, no prefix in URL)
 *   tr   — Türkçe
 *   de   — Deutsch
 *   es   — Español
 *   fr   — Français
 *   ja   — 日本語
 *   pt-br — Português (Brasil)
 *   pl   — Polski
 *   it   — Italiano
 *   nl   — Nederlands
 *
 * URL pattern:
 *   /                 → en
 *   /tr               → Turkish
 *   /de/dashboard     → German dashboard
 *   /global/turkey    → English Turkey landing
 *   /tr/global/turkey → Turkish Turkey landing
 *
 * Locale prefix strategy: 'as-needed' — English content lives at root, other
 * locales get a prefix. This preserves existing /dashboard, /pulse, /layoffs
 * URLs and only requires migration for locale-prefixed paths.
 */

export const LOCALES = ['en', 'tr', 'de', 'es', 'fr', 'ja', 'pt-br', 'pl', 'it', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  'pt-br': 'Português (BR)',
  pl: 'Polski',
  it: 'Italiano',
  nl: 'Nederlands',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  tr: '🇹🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  ja: '🇯🇵',
  'pt-br': '🇧🇷',
  pl: '🇵🇱',
  it: '🇮🇹',
  nl: '🇳🇱',
};

/** BCP-47 locale → ISO 3166 default country mapping (for country defaults
 *  when no explicit country is in the URL). */
export const LOCALE_DEFAULT_COUNTRY: Record<Locale, string> = {
  en: 'US',
  tr: 'TR',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  ja: 'JP',
  'pt-br': 'BR',
  pl: 'PL',
  it: 'IT',
  nl: 'NL',
};
