'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Commentary } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { timeAgo } from '@/lib/utils'

export default function PulsePage() {
  const [commentaries, setCommentaries] = useState<Commentary[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('commentary')
          .select('*')
          .eq('type', 'weekly_pulse')
          .order('published_at', { ascending: false })
        if (error) throw error
        if (data && data.length > 0) setCommentaries(data as Commentary[])
      } catch {
        // No fallback — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.textTertiary }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px', fontFamily: theme.fontHeading }}>Weekly Pulse</h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0 }}>AI-generated analysis on civilizational stress</p>
        </div>

        {commentaries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {commentaries.map(c => {
              const excerpt = c.body_markdown.split('\n').find(l => !l.startsWith('#') && l.trim())?.substring(0, 180)
              return (
                <Link key={c.id} href={`/pulse/${c.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 24, cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = theme.accent + '66')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = theme.surfaceBorder)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1 }}>WEEKLY PULSE</span>
                      <span style={{ fontSize: 11, color: theme.textTertiary }}>{timeAgo(c.published_at)}</span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px', fontFamily: theme.fontHeading }}>{c.title}</h2>
                    <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>{excerpt}...</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><DomainIcon domain="sentiment" size={40} color={theme.textTertiary} /></div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 8px', fontFamily: theme.fontHeading }}>Pulse reports coming soon</h2>
            <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Weekly AI-generated analysis based on live data from BLS, FRED, World Bank, and OECD will appear here. Check the dashboard for real-time data.
            </p>
            <Link href="/dashboard" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: theme.accent, fontWeight: 600, textDecoration: 'none' }}>
              View Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
