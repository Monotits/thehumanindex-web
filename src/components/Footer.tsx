'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export function Footer() {
  const { theme } = useTheme()

  const linkStyle: React.CSSProperties = { color: theme.textTertiary, textDecoration: 'none', transition: 'color 0.15s' }

  return (
    <footer style={{ borderTop: `1px solid ${theme.surfaceBorder}`, background: theme.bg, padding: '32px 0 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Top row — nav columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24, marginBottom: 24, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 600, color: theme.textSecondary, marginBottom: 10, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Index</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/dashboard" style={linkStyle}>Dashboard</Link>
              <Link href="/pulse" style={linkStyle}>Weekly Pulse</Link>
              <Link href="/methodology" style={linkStyle}>Methodology</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: theme.textSecondary, marginBottom: 10, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/quiz" style={linkStyle}>AI Exposure Quiz</Link>
              <Link href="/settings" style={linkStyle}>Theme Settings</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: theme.textSecondary, marginBottom: 10, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Project</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/about" style={linkStyle}>About</Link>
              <Link href="/contact" style={linkStyle}>Contact</Link>
              <Link href="/feed.xml" style={linkStyle}>RSS Feed</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: theme.textSecondary, marginBottom: 10, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Data Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: theme.textTertiary }}>
              <span>BLS / FRED</span>
              <span>World Bank / OECD</span>
              <span>WHO / V-Dem</span>
              <span>O*NET / AI Index</span>
              <span>WARN Act / Reddit</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${theme.surfaceBorder}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: theme.textTertiary }}>
            © {new Date().getFullYear()} The Human Index — Independent research project. Not financial advice.
          </span>
          <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono }}>
            v1.0 · Updated weekly
          </span>
        </div>
      </div>
    </footer>
  )
}
