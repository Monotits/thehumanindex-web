'use client'

import { useEffect, useState, ReactNode } from 'react'
import Link from 'next/link'
import { Commentary, DOMAIN_LABELS, Domain } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { MOCK_COMMENTARIES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { useTheme, ThemeConfig } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import { ShareButton } from '@/components/share'
import type { PulseCardData } from '@/components/share'
import { useParams } from 'next/navigation'

// ── Score extraction helpers ──────────────────────────────

function extractScore(body: string): number | null {
  const patterns = [
    /composite[^.]*?(\d{2,3}(?:\.\d)?)/i,
    /reading of (\d{2,3}(?:\.\d)?)/i,
    /index.*?at\s+\*?\*?(\d{2,3}(?:\.\d)?)/i,
    /Weekly Pulse at \*?\*?(\d{2,3}(?:\.\d)?)/i,
  ]
  for (const p of patterns) {
    const m = body.match(p)
    if (m) return parseFloat(m[1])
  }
  return null
}

function extractDomainScores(body: string): { domain: Domain; score: number }[] {
  const results: { domain: Domain; score: number }[] = []
  const domainPatterns: { domain: Domain; patterns: RegExp[] }[] = [
    { domain: 'work_risk', patterns: [/Work Risk[^:]*?:\s*(?:Up[^.]*?to\s+)?(\d{2})/i, /Work Risk sub-index (?:to|at) (\d{2})/i, /Work Risk.*?score of (\d{2})/i] },
    { domain: 'inequality', patterns: [/(?:Income )?Inequality[^:]*?(?:at|holds at|:)\s*(\d{2})/i] },
    { domain: 'unrest', patterns: [/(?:Social )?Unrest[^:]*?(?:to|at|:)\s*(\d{2})/i] },
    { domain: 'decay', patterns: [/(?:Institutional )?Decay[^:]*?(?:at|reading of|:)\s*(\d{2})/i] },
    { domain: 'wellbeing', patterns: [/(?:Social )?Wellbeing[^:]*?(?:to|at|dropped to|:)\s*(\d{2})/i] },
    { domain: 'policy', patterns: [/Policy[^:]*?(?:at|:)\s*(\d{2})/i, /Policy Response sub-index.*?(\d{2})/i] },
    { domain: 'sentiment', patterns: [/(?:Public )?Sentiment[^:]*?(?:at|:)\s*(\d{2})/i] },
  ]
  for (const { domain, patterns } of domainPatterns) {
    for (const p of patterns) {
      const m = body.match(p)
      if (m) {
        results.push({ domain, score: parseInt(m[1]) })
        break
      }
    }
  }
  return results
}

function scoreBandColor(score: number): string {
  if (score >= 66) return '#ef4444'
  if (score >= 46) return '#f59e0b'
  if (score >= 26) return '#3b82f6'
  return '#22c55e'
}

function scoreBandLabel(score: number): string {
  if (score >= 81) return 'CRITICAL'
  if (score >= 66) return 'HIGH'
  if (score >= 46) return 'ELEVATED'
  if (score >= 26) return 'MODERATE'
  return 'LOW'
}

// ── Markdown renderer ──────────────────────────────

function renderInline(text: string, theme: ThemeConfig): ReactNode[] {
  // Split by bold markers and render
  const parts: ReactNode[] = []
  const boldRegex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      <strong key={key++} style={{ color: theme.isDark ? '#fff' : theme.text, fontWeight: 600 }}>
        {match[1]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  return parts
}

function renderMarkdown(markdown: string, theme: ThemeConfig): ReactNode[] {
  const lines = markdown.split('\n')
  const elements: ReactNode[] = []
  let listBuffer: ReactNode[] = []
  let key = 0

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${key++}`} style={{ margin: '12px 0 20px', paddingLeft: 24, listStyleType: 'none' }}>
          {listBuffer}
        </ul>
      )
      listBuffer = []
    }
  }

  for (const line of lines) {
    // Skip the first H1 since we show it as the page title
    if (line.startsWith('# ') && elements.length === 0) continue

    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={key++} style={{
          fontSize: 20, fontWeight: 600,
          color: theme.isDark ? '#fff' : theme.text,
          marginTop: 32, marginBottom: 14,
          fontFamily: theme.fontHeading,
          paddingBottom: 8,
          borderBottom: `1px solid ${theme.surfaceBorder}`,
        }}>
          {line.replace(/^## /, '')}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={key++} style={{
          fontSize: 17, fontWeight: 600,
          color: theme.isDark ? '#fff' : theme.text,
          marginTop: 20, marginBottom: 10,
          fontFamily: theme.fontHeading,
        }}>
          {line.replace(/^### /, '')}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      const content = line.replace(/^- /, '')
      listBuffer.push(
        <li key={key++} style={{
          color: theme.textSecondary,
          marginBottom: 10,
          lineHeight: 1.7,
          fontSize: 15,
          position: 'relative',
          paddingLeft: 16,
        }}>
          <span style={{ position: 'absolute', left: 0, color: theme.accent, fontWeight: 700 }}>•</span>
          {renderInline(content, theme)}
        </li>
      )
    } else if (line.trim()) {
      flushList()
      elements.push(
        <p key={key++} style={{
          color: theme.textSecondary,
          marginBottom: 18,
          lineHeight: 1.85,
          fontSize: 16,
        }}>
          {renderInline(line, theme)}
        </p>
      )
    }
  }
  flushList()
  return elements
}

// ── Main component ──────────────────────────────

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
        // Fall back to mock data
        const mock = MOCK_COMMENTARIES.find(c => c.slug === slug)
        setCommentary(mock || null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.textTertiary, fontFamily: theme.fontMono, fontSize: 13 }}>Loading pulse...</div>
      </div>
    )
  }

  if (!commentary) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', paddingTop: 64 }}>
          <DomainIcon domain="sentiment" size={48} color={theme.textTertiary} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, marginTop: 16, marginBottom: 8, fontFamily: theme.fontHeading }}>Pulse not found</h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 24 }}>This report may have been removed or the URL is incorrect.</p>
          <Link href="/pulse" style={{ color: theme.accent, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>← Back to all Pulse reports</Link>
        </div>
      </div>
    )
  }

  const compositeScore = extractScore(commentary.body_markdown)
  const domainScores = extractDomainScores(commentary.body_markdown)

  // Find adjacent pulse reports for navigation
  const allPulses = MOCK_COMMENTARIES
  const currentIdx = allPulses.findIndex(c => c.slug === slug)
  const prevPulse = currentIdx < allPulses.length - 1 ? allPulses[currentIdx + 1] : null
  const nextPulse = currentIdx > 0 ? allPulses[currentIdx - 1] : null

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        {/* Breadcrumb */}
        <Link href="/pulse" style={{ color: theme.accent, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28, fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All Pulse Reports
        </Link>

        {/* Hero Score Card */}
        {compositeScore !== null && (
          <div style={{
            background: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 10,
            padding: '24px 28px',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: scoreBandColor(compositeScore) }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 10,
                  background: `${scoreBandColor(compositeScore)}15`,
                  border: `2px solid ${scoreBandColor(compositeScore)}40`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: scoreBandColor(compositeScore), fontFamily: theme.fontMono, lineHeight: 1 }}>
                    {compositeScore.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 8, color: scoreBandColor(compositeScore), fontFamily: theme.fontMono, letterSpacing: 1, marginTop: 2 }}>
                    {scoreBandLabel(compositeScore)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Composite Score</div>
                  <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.4 }}>
                    The Human Index reading at time of this report
                  </div>
                </div>
              </div>

              {/* Date */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 1, marginBottom: 2 }}>PUBLISHED</div>
                <time style={{ fontSize: 14, color: theme.textSecondary }}>{formatDate(commentary.published_at)}</time>
              </div>
            </div>

            {/* Domain scores bar */}
            {domainScores.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.surfaceBorder}` }}>
                <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
                  Domain Readings Mentioned
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} className="stat-bar">
                  {domainScores.map(ds => (
                    <div key={ds.domain} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 8,
                      background: `${scoreBandColor(ds.score)}10`,
                      border: `1px solid ${scoreBandColor(ds.score)}20`,
                    }}>
                      <DomainIcon domain={ds.domain} size={14} color={scoreBandColor(ds.score)} />
                      <span style={{ fontSize: 11, color: theme.textSecondary }}>{DOMAIN_LABELS[ds.domain].split(' ')[0]}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: scoreBandColor(ds.score), fontFamily: theme.fontMono }}>{ds.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32, fontWeight: 300,
            color: theme.isDark ? '#fff' : theme.text,
            margin: '0 0 12px',
            fontFamily: theme.fontHeading,
            lineHeight: 1.25,
          }}>
            {commentary.title}
          </h1>
          {compositeScore === null && (
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: theme.textTertiary }}>
              <time>{formatDate(commentary.published_at)}</time>
              <span>Weekly Pulse Report</span>
            </div>
          )}
        </div>

        {/* Article body */}
        <article style={{
          background: theme.surface,
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 10,
          padding: '36px 32px',
        }}>
          {renderMarkdown(commentary.body_markdown, theme)}

          {/* AI-generated content disclaimer */}
          <div style={{
            marginTop: 32, paddingTop: 16,
            borderTop: `1px solid ${theme.surfaceBorder}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p style={{ fontSize: 11, color: theme.textTertiary, lineHeight: 1.6, margin: 0 }}>
              This report is AI-generated based on live data from our pipeline. Domain scores reflect real data from BLS, FRED, World Bank, OECD, and other sources. Contextual analysis is produced by AI and may contain interpretive commentary. We do not fabricate statistics or attribute data to institutions without verification.
            </p>
          </div>
        </article>

        {/* Reading time & share */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, padding: '12px 0',
          fontSize: 12, color: theme.textTertiary,
        }}>
          <span>{Math.max(2, Math.ceil(commentary.body_markdown.split(' ').length / 200))} min read</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ShareButton
              data={{
                type: 'pulse',
                title: commentary.title,
                excerpt: commentary.body_markdown.split('\n').filter(l => !l.startsWith('#') && l.trim()).join(' ').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 180),
                compositeScore,
                date: formatDate(commentary.published_at),
              } as PulseCardData}
              variant="compact"
              label="Share"
            />
            <Link href="/" style={{ color: theme.textTertiary, textDecoration: 'none', fontSize: 12 }}>Dashboard</Link>
            <Link href="/methodology" style={{ color: theme.textTertiary, textDecoration: 'none', fontSize: 12 }}>Methodology</Link>
          </div>
        </div>

        {/* Navigation between pulses */}
        <div style={{
          marginTop: 32, paddingTop: 24,
          borderTop: `1px solid ${theme.surfaceBorder}`,
          display: 'flex', justifyContent: 'space-between',
          gap: 16,
        }}
        className="pulse-nav"
        >
          {prevPulse ? (
            <Link href={`/pulse/${prevPulse.slug}`} style={{
              textDecoration: 'none', flex: 1,
              padding: '16px 20px', borderRadius: 10,
              background: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = theme.accent + '44')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = theme.surfaceBorder)}
            >
              <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 1, marginBottom: 6 }}>← OLDER</div>
              <div style={{ fontSize: 14, color: theme.isDark ? '#fff' : theme.text, fontWeight: 500, lineHeight: 1.3 }}>{prevPulse.title}</div>
            </Link>
          ) : <div />}
          {nextPulse ? (
            <Link href={`/pulse/${nextPulse.slug}`} style={{
              textDecoration: 'none', flex: 1, textAlign: 'right',
              padding: '16px 20px', borderRadius: 10,
              background: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = theme.accent + '44')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = theme.surfaceBorder)}
            >
              <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 1, marginBottom: 6 }}>NEWER →</div>
              <div style={{ fontSize: 14, color: theme.isDark ? '#fff' : theme.text, fontWeight: 500, lineHeight: 1.3 }}>{nextPulse.title}</div>
            </Link>
          ) : <div />}
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/pulse" style={{ color: theme.accent, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            ← View all Pulse reports
          </Link>
        </div>
      </div>
    </div>
  )
}
