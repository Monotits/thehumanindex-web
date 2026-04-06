'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme'
import CorporateLayoffTable from '@/components/CorporateLayoffTable'
import SocialFeedSection from '@/components/SocialFeedSection'
import LayoffTracker from '@/components/LayoffTracker'
import Link from 'next/link'
import { ShareButton } from '@/components/share'
import type { LayoffCardData } from '@/components/share'
import { CorporateLayoffSummary } from '@/lib/corporateLayoffs'

function formatAffected(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toLocaleString()
}

export default function LayoffsPage() {
  const { theme } = useTheme()
  const [layoffData, setLayoffData] = useState<CorporateLayoffSummary | null>(null)

  useEffect(() => {
    fetch('/api/corporate-layoffs')
      .then(r => r.json())
      .then((d: CorporateLayoffSummary) => setLayoffData(d))
      .catch(() => {})
  }, [])

  // Build share card data from real layoff data
  const shareData: LayoffCardData = {
    type: 'layoff',
    totalAffected: layoffData
      ? formatAffected(layoffData.totalAffected)
      : '...',
    topCompanies: layoffData
      ? layoffData.layoffs.slice(0, 5).map(l => ({
          name: l.company,
          count: formatAffected(l.peopleAffected),
          reason: l.reason.map(r => r.replace(/_/g, ' ')).join(', '),
        }))
      : [],
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/dashboard" style={{ color: theme.textTertiary, textDecoration: 'none' }}>Dashboard</Link>
            {' / '}
            Layoffs
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.isDark ? '#fff' : theme.text, margin: '0' }}>
              Layoff Tracker
            </h1>
            <ShareButton
              data={shareData}
              variant="compact"
              label="Share"
            />
          </div>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: '8px 0 0', maxWidth: 680, lineHeight: 1.6 }}>
            Real-time tracking of workforce reductions across industries — corporate announcements, WARN Act filings, and social signals.
          </p>
        </div>

        {/* Corporate Layoffs — the main table */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
          <CorporateLayoffTable />
        </div>

        {/* WARN Act Tracker */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
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
