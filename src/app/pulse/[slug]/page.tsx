'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Commentary } from '@/lib/types'
// No mock fallback — show not found if Supabase has no data
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import { useParams } from 'next/navigation'

export default function PulseDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [commentary, setCommentary] = useState<Commentary | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('commentary').select('*').eq('slug', slug).single()
        if (error) throw error
        setCommentary(data as Commentary)
      } catch {
        setCommentary(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: theme.textTertiary }}>Loading...</div></div>
  }

  if (!commentary) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', padding: 48 }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, marginBottom: 16 }}>Pulse not found</h1>
          <Link href="/pulse" style={{ color: theme.accent }}>Back to Pulse</Link>
        </div>
      </div>
    )
  }

  const sections = commentary.body_markdown.split('\n').map((line, idx) => {
    if (line.startsWith('# ')) return <h1 key={idx} style={{ fontSize: 28, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginTop: 32, marginBottom: 16, fontFamily: theme.fontHeading }}>{line.replace(/^# /, '')}</h1>
    if (line.startsWith('## ')) return <h2 key={idx} style={{ fontSize: 22, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginTop: 24, marginBottom: 12, fontFamily: theme.fontHeading }}>{line.replace(/^## /, '')}</h2>
    if (line.startsWith('### ')) return <h3 key={idx} style={{ fontSize: 18, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, marginTop: 16, marginBottom: 8, fontFamily: theme.fontHeading }}>{line.replace(/^### /, '')}</h3>
    if (line.startsWith('- ')) return <li key={idx} style={{ color: theme.textSecondary, marginLeft: 24, marginBottom: 8, lineHeight: 1.6 }}>{line.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>
    if (line.trim()) return <p key={idx} style={{ color: theme.textSecondary, marginBottom: 16, lineHeight: 1.8, fontSize: 16 }}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
    return null
  })

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
        <Link href="/pulse" style={{ color: theme.accent, fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to Pulse</Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 12px', fontFamily: theme.fontHeading }}>{commentary.title}</h1>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: theme.textTertiary }}>
            <time>{formatDate(commentary.published_at)}</time>
            <span>Weekly Pulse Report</span>
          </div>
        </div>

        <article style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 12, padding: 32 }}>
          {sections}
        </article>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${theme.surfaceBorder}`, display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/pulse" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: 14 }}>← Previous Pulses</Link>
          <Link href="/" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: 14 }}>Back to Home →</Link>
        </div>
      </div>
    </div>
  )
}
