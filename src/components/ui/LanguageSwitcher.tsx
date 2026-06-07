'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/ui/cn';
import { trackLanguageChange } from '@/lib/analytics';
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_FLAGS,
  DEFAULT_LOCALE,
  type Locale,
} from '@/i18n/config';

const COOKIE_NAME = 'NEXT_LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCurrentLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const raw = match?.[1];
  return (LOCALES as readonly string[]).includes(raw ?? '')
    ? (raw as Locale)
    : DEFAULT_LOCALE;
}

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * LanguageSwitcher — header dropdown for 10 locales.
 *
 * Strategy (cookie-based):
 *   - Writes NEXT_LOCALE cookie + localStorage on selection.
 *   - Calls router.refresh() so server components re-render with the
 *     new locale.
 *   - UI chrome (nav, footer, headings) stays in English for now.
 *     Locale-aware content surfaces (Pulse, Research, Glossary,
 *     Country detail) read the cookie server-side and fetch in the
 *     selected language.
 *
 * Visual: small button with flag + uppercase locale code that opens
 * a popover panel listing every locale. Mirrors the ThemeToggle
 * design tone.
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(DEFAULT_LOCALE);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setCurrent(getCurrentLocaleFromCookie());
  }, []);

  // close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function selectLocale(locale: Locale) {
    const previous = current;
    setCurrent(locale);
    setOpen(false);
    writeLocaleCookie(locale);
    try {
      localStorage.setItem('thi-locale', locale);
    } catch {
      /* ignore */
    }
    if (previous !== locale) {
      trackLanguageChange(previous, locale);
    }
    // Force server re-render so content surfaces pick up new locale
    router.refresh();
  }

  // SSR placeholder to avoid layout shift
  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs uppercase tracking-wider font-medium text-foreground-muted"
        aria-label="Language selector"
      >
        <GlobeIcon />
        <span>EN</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${LOCALE_LABELS[current]}. Click to change.`}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs uppercase tracking-wider font-medium text-foreground-muted hover:text-foreground hover:bg-background-alt/60 transition-colors"
      >
        <GlobeIcon />
        <span aria-hidden="true">{current === 'pt-br' ? 'PT' : current.toUpperCase()}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label="Choose language"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-background shadow-lg z-50 overflow-hidden"
        >
          <ul className="py-1 max-h-96 overflow-y-auto">
            {LOCALES.map((locale) => {
              const active = locale === current;
              return (
                <li key={locale}>
                  <button
                    type="button"
                    onClick={() => selectLocale(locale)}
                    aria-selected={active}
                    role="option"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                      'hover:bg-background-alt transition-colors',
                      active && 'bg-background-alt/60',
                    )}
                  >
                    <span className="text-base" aria-hidden="true">
                      {LOCALE_FLAGS[locale]}
                    </span>
                    <span
                      className={cn(
                        'flex-1',
                        active ? 'font-medium text-foreground' : 'text-foreground-muted',
                      )}
                    >
                      {LOCALE_LABELS[locale]}
                    </span>
                    {active && (
                      <CheckIcon className="text-foreground" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────

function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
