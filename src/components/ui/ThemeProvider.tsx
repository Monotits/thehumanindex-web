'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'thi-ui-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): ResolvedTheme {
  if (typeof document === 'undefined') return 'light';
  const resolved: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Init: read from localStorage + apply
  useEffect(() => {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Theme | null;
    const initial: Theme = stored ?? defaultTheme;
    setThemeState(initial);
    setResolvedTheme(applyTheme(initial));
  }, [defaultTheme]);

  // React to system theme change when in 'system' mode
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolvedTheme(applyTheme('system'));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
    setResolvedTheme(applyTheme(next));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback when used outside provider (during SSR or in storybook)
    return { theme: 'system', resolvedTheme: 'light', setTheme: () => {} };
  }
  return ctx;
}

/**
 * Inline script to apply the stored theme BEFORE React hydrates.
 * Insert in <head> via a `<Script>` tag to prevent flash of wrong theme.
 */
export const THEME_BOOTSTRAP_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored || 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    if (resolved === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`.trim();
