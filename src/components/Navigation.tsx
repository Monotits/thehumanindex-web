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
    { href: '/methodology', label: 'Methodology' },
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
            <span style={{ fontSize: 17, fontWeight: 700, color: navText, letterSpacing: -0.3 }}>THE HUMAN INDEX</span>
            {showLiveBadge && (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${theme.accent}20`, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1 }}>LIVE</span>
            )}
          </Link>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
