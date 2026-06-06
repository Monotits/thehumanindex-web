'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/ui/cn';
import { ThemeToggle } from './ThemeToggle';

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
  { href: '/',            label: 'Home' },
  { href: '/countries',   label: 'Countries' },
  { href: '/rankings',    label: 'Rankings' },
  { href: '/pulse',       label: 'Pulse' },
  { href: '/research',    label: 'Research' },
  { href: '/glossary',    label: 'Glossary' },
  { href: '/methodology', label: 'Methodology', shortLabel: 'Method' },
  { href: '/transparency',label: 'Transparency', shortLabel: 'Trust' },
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
            className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight hover:opacity-80"
            aria-label="The Human Index — home"
          >
            <span className="font-serif">The Human Index</span>
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

        {/* Mobile sheet */}
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
