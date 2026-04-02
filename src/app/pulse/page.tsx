'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Commentary, DOMAIN_LABELS, Domain } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'
import { MOCK_COMMENTARIES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { timeAgo } from '@/lib/utils'

/** Extract a composite score number from markdown body if mentioned */
function extractScore(body: string): number | null {
  // Look for patterns like "composite score stands at **60.1**" or "composite...58" or "reading of 58"
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

/** Extract key domains mentioned in the body */
function extractDomains(body: string): Domain[] {
  const domainKeywords: Record<Domain, RegExp[]> = {
    work_risk: [/work risk/i, /employment/i, /job/i, /labor/i, /workforce/i, /displacement/i],
    inequality: [/inequality/i, /income/i, /gini/i, /wage/i],
    unrest: [/unrest/i, /protest/i, /strike/i, /labor action/i],
    decay: [/institutional/i, /trust/i, /decay/i, /congress/i, /policy paralysis/i],
    wellbeing: [/wellbeing/i, /well-being/i, /mental health/i, /anxiety/i, /health/i],
    policy: [/policy/i, /regulation/i, /legislation/i, /AI Act/i, /regulatory/i],
    sentiment: [/sentiment/i, /public perception/i, /polling/i, /gallup/i],
  }
  const found: Domain[] = []
  for (const [domain, patterns] of Object.entries(domainKeywords)) {
    if (patterns.some(p => p.test(body))) {
      found.push(domain as Domain)
    }
  }
  return found.slice(0, 3) // max 3
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

/** Strip markdown bold markers for clean excerpt */
function cleanExcerpt(markdown: string): string {
  return markdown
    .split('\n')
    .filter(l => !l.startsWith('#') && l.trim().length > 0)
    .join(' ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .substring(0, 220)
}

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
        if (data && data.length > 2) {
          setCommentaries(data as Commentary[])
        } else {
          // Merge supabase entries with mock data (supabase first, dedup by slug)
          const supaEntries = (data || []) as Commentary[]
          const slugSet = new Set(supaEntries.map(c => c.slug))
          const mockExtras = MOCK_COMMENTARIES.filter(c => !slugSet.has(c.slug))
          setCommentaries([...supaEntries, ...mockExtras])
        }
      } catch {
        // Fall back to mock data
        setCommentaries(MOCK_COMMENTARIES)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.textTertiary, fontFamily: theme.fontMono, fontSize: 13 }}>Loading pulse data...</div>
      </div>
    )
  }

  // Separate featured (latest) from rest
  const featured = commentaries[0]
  const rest = commentaries.slice(1)

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 0', fontFamily: theme.fontBody }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <DomainIcon domain="sentiment" size={24} color={theme.accent} />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.isDark ? '#fff' : theme.text, margin: 0, fontFamily: theme.fontHeading }}>Weekly Pulse</h1>
          </div>
          <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
            AI-generated analysis on civilizational stress. Each report breaks down what moved, why it matters, and what to watch next.
          </p>
        </div>

        {/* Featured article */}
        {featured && (() => {
          const score = extractScore(featured.body_markdown)
          const domains = extractDomains(featured.body_markdown)
          const excerpt = cleanExcerpt(featured.body_markdown)
          return (
            <Link href={`/pulse/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
              <div
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.surfaceBorder}`,
                  borderRadius: 12,
                  padding: 32,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = theme.accent + '66'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = theme.surfaceBorder
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Top decorative accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${theme.accent}, transparent)` }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 10, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Latest Pulse</span>
                    <span style={{ fontSize: 11, color: theme.textTertiary }}>{timeAgo(featured.published_at)}</span>
                  </div>
                  {score !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: `${scoreBandColor(score)}15`,
                      border: `1px solid ${scoreBandColor(score)}30`,
                      borderRadius: 8, padding: '6px 12px',
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: scoreBandColor(score), fontFamily: theme.fontMono }}>{score.toFixed(1)}</span>
                      <span style={{ fontSize: 9, color: scoreBandColor(score), fontFamily: theme.fontMono, letterSpacing: 1 }}>{scoreBandLabel(score)}</span>
                    </div>
                  )}
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 12px', fontFamily: theme.fontHeading, lineHeight: 1.3 }}>{featured.title}</h2>
                <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, margin: '0 0 16px' }}>{excerpt}...</p>

                {/* Domain tags */}
                {domains.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {domains.map(d => (
                      <div key={d} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 6,
                        background: `${theme.textTertiary}15`,
                        fontSize: 11, color: theme.textSecondary,
                      }}>
                        <DomainIcon domain={d} size={12} color={theme.textSecondary} />
                        {DOMAIN_LABELS[d]}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16, fontSize: 13, color: theme.accent, fontWeight: 600 }}>Read full analysis →</div>
              </div>
            </Link>
          )
        })()}

        {/* Divider */}
        {rest.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Previous Reports</span>
            <div style={{ flex: 1, height: 1, background: theme.surfaceBorder }} />
          </div>
        )}

        {/* Article list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rest.map(c => {
            const score = extractScore(c.body_markdown)
            const domains = extractDomains(c.body_markdown)
            const excerpt = cleanExcerpt(c.body_markdown)
            return (
              <Link key={c.id} href={`/pulse/${c.slug}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.surfaceBorder}`,
                    borderRadius: 10,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    display: 'flex',
                    gap: 20,
                    alignItems: 'flex-start',
                  }}
                  className="pulse-card"
                  onMouseEnter={e => (e.currentTarget.style.borderColor = theme.accent + '44')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = theme.surfaceBorder)}
                >
                  {/* Score badge */}
                  {score !== null && (
                    <div style={{
                      minWidth: 52, textAlign: 'center',
                      padding: '8px 0',
                      borderRadius: 8,
                      background: `${scoreBandColor(score)}12`,
                      border: `1px solid ${scoreBandColor(score)}25`,
                      flexShrink: 0,
                    }}
                    className="hide-mobile"
                    >
                      <div style={{ fontSize: 16, fontWeight: 700, color: scoreBandColor(score), fontFamily: theme.fontMono }}>{score.toFixed(0)}</div>
                      <div style={{ fontSize: 7, color: scoreBandColor(score), fontFamily: theme.fontMono, letterSpacing: 1, marginTop: 2 }}>{scoreBandLabel(score)}</div>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase' }}>Weekly Pulse</span>
                        {/* Mobile score inline */}
                        {score !== null && (
                          <span className="show-mobile-inline" style={{
                            display: 'none',
                            fontSize: 10, fontWeight: 700, color: scoreBandColor(score), fontFamily: theme.fontMono,
                            padding: '2px 6px', borderRadius: 4,
                            background: `${scoreBandColor(score)}15`,
                          }}>{score.toFixed(0)}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: theme.textTertiary }}>{timeAgo(c.published_at)}</span>
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, margin: '0 0 6px', fontFamily: theme.fontHeading, lineHeight: 1.3 }}>{c.title}</h2>
                    <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }} className="hide-mobile">{excerpt.substring(0, 160)}...</p>

                    {/* Domain chips */}
                    {domains.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }} className="hide-mobile">
                        {domains.map(d => (
                          <span key={d} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 10, color: theme.textTertiary,
                            padding: '2px 8px', borderRadius: 4,
                            background: `${theme.textTertiary}10`,
                          }}>
                            <DomainIcon domain={d} size={10} color={theme.textTertiary} />
                            {DOMAIN_LABELS[d].split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 48, padding: '20px 0', borderTop: `1px solid ${theme.surfaceBorder}`, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: theme.textTertiary, lineHeight: 1.6, margin: 0 }}>
            Pulse reports are AI-generated weekly using live data from BLS, FRED, World Bank, OECD, O*NET, and sentiment analysis.
            <br />
            Domain scores are real. Contextual analysis is AI-generated and fact-checked before publication.
          </p>
        </div>
      </div>
    </div>
  )
}
