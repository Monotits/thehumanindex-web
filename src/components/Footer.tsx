'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export function Footer() {
  const { theme } = useTheme()

  return (
    <footer style={{ borderTop: `1px solid ${theme.surfaceBorder}`, background: theme.bg, padding: '24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 12, color: theme.textTertiary }}>
          © {new Date().getFullYear()} The Human Index — Data from FRED, BLS, World Bank, GDELT
        </span>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <Link href="/methodology" style={{ color: theme.textTertiary, textDecoration: 'none' }}>Methodology</Link>
          <Link href="/pulse" style={{ color: theme.textTertiary, textDecoration: 'none' }}>Pulse</Link>
          <Link href="/settings" style={{ color: theme.textTertiary, textDecoration: 'none' }}>Settings</Link>
          <a href="#" style={{ color: theme.textTertiary, textDecoration: 'none' }}>Privacy</a>
        </div>
      </div>
    </footer>
  )
}
