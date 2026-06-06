'use client';

import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

/**
 * ThemeToggle — sun/moon icon button.
 *
 * Cycles light → dark → system → light.
 * Tooltip / aria-label reflects what clicking will switch TO.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // SSR placeholder — render same dimensions to avoid layout shift
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="p-2 rounded-md text-foreground-muted"
      >
        <SunIcon />
      </button>
    );
  }

  const next: typeof theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const labelMap = {
    light:  'Switch to dark mode',
    dark:   'Switch to system theme',
    system: 'Switch to light mode',
  };

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={labelMap[theme]}
      title={`Theme: ${theme} (click → ${next})`}
      className="p-2 rounded-md text-foreground-muted hover:text-foreground hover:bg-background-alt/60 transition-colors"
    >
      {theme === 'system' ? (
        <SystemIcon />
      ) : resolvedTheme === 'dark' ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </button>
  );
}

// ── Icons (inline SVG, no external dependency) ──

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
