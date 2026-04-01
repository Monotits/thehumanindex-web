'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme'
import { SocialFeedItem } from '@/lib/socialFeed'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function formatScore(score: number): string {
  if (score === 0) return ''
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
  return score.toString()
}

export default function SocialFeedSection() {
  const { theme, themeId } = useTheme()
  const [items, setItems] = useState<SocialFeedItem[]>([])
  const [isLive, setIsLive] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/social-feed')
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) {
          setItems(data.items)
          setIsLive(data.source === 'live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visibleItems = expanded ? items : items.slice(0, 6)
  const isBriefing = themeId === 'briefing'

  const sourceColors: Record<string, string> = {
    reddit: '#ff4500',
    news: themeId === 'terminal' ? '#00ff88' : theme.accent,
    x: '#1d9bf0',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{
            fontSize: themeId === 'terminal' ? 13 : 16,
            fontWeight: themeId === 'terminal' ? 400 : 700,
            color: theme.text,
            margin: 0,
            fontFamily: themeId === 'terminal' ? theme.fontMono : theme.fontHeading,
            textTransform: themeId === 'terminal' ? 'uppercase' : 'none',
            letterSpacing: themeId === 'terminal' ? 2 : 0,
          }}>
            {themeId === 'terminal' ? '> LIVE FEED' : 'What the World is Saying'}
          </h2>
          {isLive && (
            <span style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 3,
              background: `${theme.accent}20`,
              color: theme.accent,
              fontFamily: theme.fontMono,
              letterSpacing: 1,
              fontWeight: 600,
            }}>
              LIVE
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono }}>
          Reddit · RSS · News
        </span>
      </div>

      {/* Loading / Empty state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 24, color: theme.textTertiary, fontSize: 13 }}>
          Fetching live feed from Reddit and news sources...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: theme.textTertiary, fontSize: 13 }}>
          No live feed items available right now. Check back soon.
        </div>
      )}

      {/* Feed items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: themeId === 'terminal' ? 2 : 10 }}>
        {visibleItems.map(item => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: themeId === 'terminal' ? '10px 12px' : '14px 16px',
              background: isBriefing ? '#fff' : theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: themeId === 'terminal' ? 2 : 8,
              transition: 'border-color 0.15s',
              borderLeft: themeId === 'briefing' ? `3px solid ${sourceColors[item.source]}` : undefined,
            }}
          >
            {/* Top row: source + time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>{item.source_icon}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: sourceColors[item.source],
                  fontFamily: theme.fontMono,
                }}>
                  {item.source_name}
                </span>
                {item.source === 'reddit' && item.score > 0 && (
                  <span style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                    ▲ {formatScore(item.score)}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
                {timeAgo(item.published_at)}
              </span>
            </div>

            {/* Title */}
            <div style={{
              fontSize: themeId === 'terminal' ? 13 : 14,
              fontWeight: 600,
              color: theme.text,
              lineHeight: 1.4,
              marginBottom: item.body ? 6 : 0,
              fontFamily: themeId === 'terminal' ? theme.fontMono : theme.fontBody,
            }}>
              {item.title}
            </div>

            {/* Body excerpt */}
            {item.body && (
              <div style={{
                fontSize: 12,
                color: theme.textSecondary,
                lineHeight: 1.5,
                fontFamily: theme.fontBody,
              }}>
                {item.body.slice(0, 160)}{item.body.length > 160 ? '...' : ''}
              </div>
            )}

            {/* Author */}
            {item.source === 'reddit' && (
              <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 6, fontFamily: theme.fontMono }}>
                {item.author}
              </div>
            )}
          </a>
        ))}
      </div>

      {/* Show more button */}
      {items.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 0',
            marginTop: 8,
            background: 'none',
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 6,
            color: theme.textSecondary,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: theme.fontMono,
          }}
        >
          {expanded ? 'Show less' : `Show ${items.length - 6} more`}
        </button>
      )}
    </div>
  )
}
