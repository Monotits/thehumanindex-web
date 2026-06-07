'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/ui/cn';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * SiteHeader — UI Sprint Plan v1
 *
 * Single navigation level with 8 destinations. Sticky on scroll with a
 * subtle border-bottom. Mobile collapses into hamburger menu.
 *
 * No Cmd+K palette yet — added in Faz 4 (Polish).
 */

interface NavLink {
  href: string;
  label: string;
  shortLabel?: string;
}

const PRIMARY_NAV: NavLink[] = [
  { href: '/',                       label: 'Home' },
  { href: '/countries',              label: 'Countries' },
  { href: '/countries?view=table',   label: 'Rankings' },
  { href: '/pulse',                  label: 'Pulse' },
  { href: '/research',               label: 'Research' },
  { href: '/glossary',               label: 'Glossary' },
  { href: '/methodology',            label: 'Methodology', shortLabel: 'Method' },
  { href: '/transparency',           label: 'Transparency', shortLabel: 'Trust' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b',
        scrolled ? 'border-border' : 'border-transparent',
        'transition-colors duration-150',
      )}
    >
      <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo / wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            aria-label="The Human Index — home"
          >
            <LogoMark />
            <span className="font-serif text-lg font-semibold tracking-tight">
              The Human Index
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-1 text-sm"
            aria-label="Primary"
          >
            {PRIMARY_NAV.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md transition-colors',
                  isActive(link.href)
                    ? 'text-foreground bg-background-alt font-medium'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-alt/60',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 -mr-2 rounded-md text-foreground-muted hover:text-foreground hover:bg-background-alt/60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6"  x2="6"  y2="18" />
                    <line x1="6"  y1="6"  x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3"  y1="6"  x2="21" y2="6" />
                    <line x1="3"  y1="12" x2="21" y2="12" />
                    <line x1="3"  y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* (mobile sheet below) */}
        {mobileOpen && (
          <nav
            className="md:hidden pb-4 pt-2 border-t border-border"
            aria-label="Primary mobile"
          >
            <ul className="flex flex-col gap-1">
              {PRIMARY_NAV.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-md text-sm',
                      isActive(link.href)
                        ? 'bg-background-alt text-foreground font-medium'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-alt/60',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

// ── Logo mark ──────────────────────────────────────────────────────
// "H/I" infinity/loop monogram. currentColor follows theme.
function LogoMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
      className="shrink-0 text-foreground"
    >
      {/* Box = page bg (invisible fill, just defines rounded box for the border) */}
      <rect
        width="32"
        height="32"
        rx="6"
        fill="var(--background)"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Symbol = foreground (currentColor) — visible against page bg */}
      <path
        d="M 11.6 4.0 L 12.9 4.0 L 14.2 4.0 L 15.6 4.0 L 16.8 4.0 L 18.2 4.0 L 19.5 4.0 L 20.8 4.1 L 21.8 4.4 L 22.6 4.8 L 23.3 5.5 L 23.8 6.3 L 24.1 7.3 L 24.0 8.4 L 23.8 9.5 L 23.3 10.4 L 22.7 11.1 L 22.0 11.7 L 21.4 12.3 L 20.7 12.9 L 20.0 13.5 L 19.3 14.2 L 18.6 14.8 L 17.9 15.4 L 17.3 16.1 L 18.0 16.6 L 18.7 17.3 L 19.4 17.9 L 20.1 18.5 L 20.7 19.2 L 21.4 19.8 L 22.1 20.4 L 22.8 21.1 L 23.4 21.8 L 23.8 22.6 L 24.1 23.7 L 24.1 24.9 L 23.8 25.9 L 23.3 26.7 L 22.6 27.3 L 21.6 27.7 L 20.6 28.0 L 19.3 28.0 L 18.0 28.0 L 16.7 28.0 L 15.4 28.0 L 14.1 28.0 L 12.8 28.0 L 11.5 28.0 L 10.4 27.7 L 9.5 27.3 L 8.8 26.7 L 8.2 26.0 L 8.0 25.0 L 7.9 23.8 L 8.2 22.8 L 8.6 21.9 L 9.2 21.2 L 9.9 20.5 L 10.5 19.9 L 11.2 19.2 L 11.9 18.6 L 12.6 18.0 L 13.2 17.3 L 14.0 16.7 L 14.7 16.1 L 14.2 15.4 L 13.5 14.9 L 12.8 14.2 L 12.1 13.6 L 11.4 13.0 L 10.7 12.3 L 10.1 11.7 L 9.4 11.1 L 8.7 10.4 L 8.2 9.6 L 8.0 8.5 L 7.9 7.4 L 8.2 6.3 L 8.7 5.5 L 9.3 4.8 L 10.1 4.4 L 11.2 4.1 Z M 11.7 5.7 L 10.8 5.9 L 10.1 6.3 L 9.7 7.0 L 9.6 7.9 L 9.8 8.8 L 10.1 9.5 L 10.7 10.1 L 11.3 10.6 L 11.8 11.1 L 12.4 11.6 L 13.0 12.2 L 13.6 12.7 L 14.2 13.2 L 14.7 13.7 L 15.3 14.2 L 15.9 14.8 L 16.5 14.4 L 17.1 13.9 L 17.7 13.4 L 18.3 12.9 L 18.8 12.3 L 19.4 11.8 L 20.0 11.3 L 20.5 10.8 L 21.2 10.2 L 21.7 9.7 L 22.1 9.0 L 22.4 8.2 L 22.4 7.2 L 22.0 6.5 L 21.4 6.0 L 20.6 5.8 L 19.5 5.7 L 18.5 5.7 L 17.3 5.7 L 16.2 5.7 L 15.2 5.7 L 14.0 5.7 L 12.9 5.7 L 11.8 5.7 Z M 16.0 17.2 L 15.4 17.7 L 14.8 18.2 L 14.2 18.8 L 13.7 19.2 L 13.1 19.8 L 12.5 20.3 L 11.9 20.9 L 11.3 21.4 L 10.8 21.9 L 10.3 22.4 L 9.9 23.1 L 9.6 24.0 L 9.6 25.0 L 10.1 25.6 L 10.7 26.0 L 11.6 26.3 L 12.7 26.4 L 13.7 26.4 L 14.9 26.4 L 16.0 26.4 L 17.1 26.4 L 18.2 26.4 L 19.3 26.4 L 20.4 26.3 L 21.2 26.1 L 21.9 25.7 L 22.4 25.0 L 22.4 24.0 L 22.2 23.2 L 21.8 22.5 L 21.3 21.9 L 20.7 21.4 L 20.1 20.9 L 19.5 20.3 L 19.0 19.8 L 18.4 19.3 L 17.8 18.8 L 17.2 18.3 L 16.6 17.7 L 16.1 17.2 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
