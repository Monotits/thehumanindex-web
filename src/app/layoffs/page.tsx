'use client'

import { useTheme } from '@/lib/theme'
import CorporateLayoffTable from '@/components/CorporateLayoffTable'
import SocialFeedSection from '@/components/SocialFeedSection'
import LayoffTracker from '@/components/LayoffTracker'
import Link from 'next/link'

export default function LayoffsPage() {
  const { theme } = useTheme()

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/dashboard" style={{ color: theme.textTertiary, textDecoration: 'none' }}>Dashboard</Link>
            {' / '}
            Layoffs
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px' }}>
            Layoff Tracker
          </h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0, maxWidth: 680, lineHeight: 1.6 }}>
            Real-time tracking of workforce reductions across industries — corporate announcements, WARN Act filings, and social signals.
          </p>
        </div>

        {/* Corporate Layoffs — the main table */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <CorporateLayoffTable />
        </div>

        {/* WARN Act Tracker */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <LayoffTracker />
        </div>

        {/* Social Feed — layoff-related social signals */}
        <div style={{ marginBottom: 24 }}>
          <SocialFeedSection />
        </div>

        {/* Back to Dashboard */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Link href="/dashboard" style={{
            fontSize: 13, color: theme.accent, textDecoration: 'none',
            padding: '10px 24px', borderRadius: 8,
            border: `1px solid ${theme.accent}30`,
            background: `${theme.accent}08`,
          }}>
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
