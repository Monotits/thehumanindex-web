'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, themeId } = useTheme()

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/quiz', label: 'Quiz' },
    { href: '/pulse', label: 'Pulse' },
    { href: '/about', label: 'About' },
    { href: '/settings', label: '⚙' },
  ]

  // Briefing theme uses dark nav despite light body
  const navBg = themeId === 'briefing' ? '#1a2332' : `${theme.bg}f2`
  const navBorder = themeId === 'briefing' ? '#2a3442' : theme.surfaceBorder
  const navText = '#fff'
  const navTextDim = themeId === 'briefing' ? 'rgba(255,255,255,0.6)' : theme.textSecondary

  // Terminal shows LIVE badge
  const showLiveBadge = themeId === 'terminal'

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${navBorder}`, background: navBg, backdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {/* Hourglass icon */}
            <svg width="12" height="18" viewBox="0 0 25 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 6.3 3.0 L 8.1 3.0 L 10.0 3.0 L 11.9 3.0 L 13.7 3.0 L 15.6 3.0 L 17.5 3.0 L 19.3 3.1 L 20.7 3.5 L 21.9 4.2 L 22.9 5.1 L 23.6 6.2 L 24.0 7.7 L 23.9 9.3 L 23.5 10.8 L 22.9 12.0 L 22.0 13.0 L 21.0 13.9 L 20.1 14.8 L 19.1 15.6 L 18.1 16.5 L 17.2 17.4 L 16.2 18.3 L 15.2 19.2 L 14.3 20.1 L 15.3 20.9 L 16.3 21.8 L 17.3 22.7 L 18.3 23.6 L 19.2 24.5 L 20.2 25.4 L 21.2 26.3 L 22.1 27.2 L 23.0 28.2 L 23.6 29.4 L 24.0 30.9 L 24.0 32.6 L 23.5 34.0 L 22.8 35.1 L 21.8 36.0 L 20.5 36.6 L 19.0 37.0 L 17.2 37.0 L 15.4 37.0 L 13.5 37.0 L 11.7 37.0 L 9.8 37.0 L 7.9 37.0 L 6.1 37.0 L 4.6 36.6 L 3.3 36.0 L 2.3 35.2 L 1.5 34.1 L 1.1 32.8 L 1.0 31.1 L 1.4 29.6 L 2.0 28.3 L 2.8 27.3 L 3.8 26.4 L 4.7 25.5 L 5.7 24.6 L 6.7 23.7 L 7.7 22.8 L 8.6 21.9 L 9.6 21.0 L 10.6 20.1 L 9.9 19.2 L 8.9 18.4 L 7.9 17.5 L 7.0 16.6 L 6.0 15.7 L 5.0 14.8 L 4.1 13.9 L 3.1 13.1 L 2.2 12.0 L 1.5 10.9 L 1.1 9.4 L 1.0 7.8 L 1.4 6.3 L 2.1 5.1 L 3.0 4.2 L 4.2 3.6 L 5.7 3.1 Z M 6.4 5.4 L 5.2 5.7 L 4.2 6.3 L 3.6 7.2 L 3.4 8.5 L 3.7 9.8 L 4.2 10.8 L 5.0 11.6 L 5.8 12.3 L 6.6 13.1 L 7.4 13.8 L 8.3 14.6 L 9.1 15.3 L 9.9 16.0 L 10.7 16.8 L 11.5 17.5 L 12.4 18.3 L 13.2 17.8 L 14.0 17.0 L 14.9 16.3 L 15.7 15.6 L 16.5 14.8 L 17.3 14.1 L 18.1 13.3 L 18.9 12.6 L 19.8 11.8 L 20.6 11.1 L 21.2 10.1 L 21.6 9.0 L 21.6 7.6 L 21.0 6.6 L 20.2 5.9 L 19.0 5.5 L 17.5 5.4 L 16.0 5.4 L 14.4 5.4 L 12.8 5.4 L 11.3 5.4 L 9.7 5.4 L 8.1 5.4 L 6.6 5.4 Z M 12.5 21.7 L 11.7 22.4 L 10.8 23.1 L 10.0 23.9 L 9.2 24.6 L 8.4 25.4 L 7.6 26.1 L 6.7 26.9 L 5.9 27.6 L 5.1 28.3 L 4.4 29.1 L 3.8 30.1 L 3.4 31.3 L 3.5 32.7 L 4.1 33.6 L 5.0 34.2 L 6.3 34.6 L 7.8 34.7 L 9.3 34.7 L 10.9 34.7 L 12.5 34.7 L 14.0 34.7 L 15.6 34.7 L 17.2 34.7 L 18.7 34.6 L 19.9 34.3 L 20.9 33.7 L 21.5 32.7 L 21.6 31.4 L 21.3 30.2 L 20.7 29.2 L 20.0 28.4 L 19.1 27.6 L 18.3 26.9 L 17.5 26.1 L 16.7 25.4 L 15.9 24.7 L 15.0 23.9 L 14.2 23.2 L 13.4 22.4 L 12.6 21.7 Z" fill="white" fillRule="evenodd"/>
            </svg>
            <span style={{ fontSize: 17, fontWeight: 700, color: navText, letterSpacing: -0.3 }}>THE HUMAN INDEX</span>
            {showLiveBadge && (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${theme.accent}20`, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1 }}>LIVE</span>
            )}
          </Link>

          {/* Desktop links */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {links.map(({ href, label }) => {
              const isActive = pathname.startsWith(href)
              const isSettings = href === '/settings'
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: '6px 14px',
                    fontSize: isSettings ? 15 : 13,
                    fontWeight: 500,
                    color: isActive ? navText : navTextDim,
                    textDecoration: 'none',
                    borderRadius: 6,
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: navTextDim, cursor: 'pointer', padding: 8 }}
            className="mobile-menu-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ paddingBottom: 16, borderTop: `1px solid ${navBorder}`, marginTop: 8, paddingTop: 16 }}>
            {links.map(({ href, label }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'block', padding: '8px 0', fontSize: 14, fontWeight: 500, color: isActive ? navText : navTextDim, textDecoration: 'none' }}>
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
