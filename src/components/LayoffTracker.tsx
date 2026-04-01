'use client'

import { useEffect, useState } from 'react'
import { useTheme, ThemeConfig } from '@/lib/theme'
import { LayoffSummary, LayoffEvent } from '@/lib/layoffData'

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

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

const INDUSTRY_COLORS: Record<string, string> = {
  Tech: '#3b82f6',
  Finance: '#10b981',
  Media: '#f59e0b',
  Entertainment: '#8b5cf6',
  Healthcare: '#ef4444',
  Consulting: '#06b6d4',
  Gaming: '#ec4899',
  Automotive: '#f97316',
  Telecom: '#14b8a6',
  Aerospace: '#6366f1',
  Retail: '#84cc16',
  Energy: '#eab308',
  Industrial: '#78716c',
  Crypto: '#f59e0b',
  Other: '#9ca3af',
}

const TREND_LABELS = {
  increasing: { text: 'Increasing', icon: '▲', color: '#ef4444' },
  stable: { text: 'Stable', icon: '●', color: '#f59e0b' },
  decreasing: { text: 'Decreasing', icon: '▼', color: '#10b981' },
}

export default function LayoffTracker() {
  const { theme, themeId } = useTheme()
  const [data, setData] = useState<LayoffSummary | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/layoffs')
      .then(r => r.json())
      .then((d: LayoffSummary) => {
        if (d.events?.length > 0) {
          setData(d)
          setIsLive(d.source === 'live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: theme.textTertiary, fontSize: 13 }}>
        Fetching layoff data from Reddit and news sources...
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: theme.textTertiary, fontSize: 13 }}>
        No layoff data available right now. Check back soon.
      </div>
    )
  }

  const trend = TREND_LABELS[data.stats.trend]

  const filteredEvents = selectedIndustry
    ? data.events.filter(e => e.industry === selectedIndustry)
    : data.events

  const visibleEvents = expanded ? filteredEvents : filteredEvents.slice(0, 5)

  const isTerminal = themeId === 'terminal'
  const isBriefing = themeId === 'briefing'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{
            fontSize: isTerminal ? 13 : 18,
            fontWeight: isTerminal ? 400 : 700,
            color: theme.text,
            margin: 0,
            fontFamily: isTerminal ? theme.fontMono : theme.fontHeading,
            textTransform: isTerminal ? 'uppercase' : 'none',
            letterSpacing: isTerminal ? 2 : 0,
          }}>
            {isTerminal ? '> LAYOFF TRACKER' : 'Layoff Tracker'}
          </h2>
          {isLive && (
            <span style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 3,
              background: '#ef444420',
              color: '#ef4444',
              fontFamily: theme.fontMono,
              letterSpacing: 1,
              fontWeight: 600,
            }}>
              LIVE
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono }}>
          Reddit · News · RSS
        </span>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isTerminal ? 8 : 12,
        marginBottom: 16,
      }}>
        {/* Total Affected */}
        <div style={{
          padding: isTerminal ? '10px 12px' : '14px 16px',
          background: isBriefing ? '#fff' : theme.surface,
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: isTerminal ? 2 : 8,
        }}>
          <div style={{
            fontSize: 10,
            color: theme.textTertiary,
            fontFamily: theme.fontMono,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
          }}>
            Affected (30d)
          </div>
          <div style={{
            fontSize: isTerminal ? 20 : 24,
            fontWeight: 700,
            color: '#ef4444',
            fontFamily: theme.fontMono,
          }}>
            {data.stats.total_affected_30d > 0 ? formatNumber(data.stats.total_affected_30d) : '—'}
          </div>
        </div>

        {/* Events Count */}
        <div style={{
          padding: isTerminal ? '10px 12px' : '14px 16px',
          background: isBriefing ? '#fff' : theme.surface,
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: isTerminal ? 2 : 8,
        }}>
          <div style={{
            fontSize: 10,
            color: theme.textTertiary,
            fontFamily: theme.fontMono,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
          }}>
            Events (30d)
          </div>
          <div style={{
            fontSize: isTerminal ? 20 : 24,
            fontWeight: 700,
            color: theme.text,
            fontFamily: theme.fontMono,
          }}>
            {data.stats.total_events_30d}
          </div>
        </div>

        {/* Trend */}
        <div style={{
          padding: isTerminal ? '10px 12px' : '14px 16px',
          background: isBriefing ? '#fff' : theme.surface,
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: isTerminal ? 2 : 8,
        }}>
          <div style={{
            fontSize: 10,
            color: theme.textTertiary,
            fontFamily: theme.fontMono,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
          }}>
            Trend
          </div>
          <div style={{
            fontSize: isTerminal ? 14 : 16,
            fontWeight: 700,
            color: trend.color,
            fontFamily: theme.fontMono,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>{trend.icon}</span>
            <span>{trend.text}</span>
          </div>
        </div>
      </div>

      {/* Industry Filter Chips */}
      {data.stats.top_industries.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 14,
        }}>
          <button
            onClick={() => setSelectedIndustry(null)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontFamily: theme.fontMono,
              border: `1px solid ${!selectedIndustry ? theme.accent : theme.surfaceBorder}`,
              borderRadius: isTerminal ? 2 : 12,
              background: !selectedIndustry ? `${theme.accent}15` : 'transparent',
              color: !selectedIndustry ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            All
          </button>
          {data.stats.top_industries.map(ind => (
            <button
              key={ind.name}
              onClick={() => setSelectedIndustry(selectedIndustry === ind.name ? null : ind.name)}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: theme.fontMono,
                border: `1px solid ${selectedIndustry === ind.name ? (INDUSTRY_COLORS[ind.name] || theme.accent) : theme.surfaceBorder}`,
                borderRadius: isTerminal ? 2 : 12,
                background: selectedIndustry === ind.name ? `${INDUSTRY_COLORS[ind.name] || theme.accent}15` : 'transparent',
                color: selectedIndustry === ind.name ? (INDUSTRY_COLORS[ind.name] || theme.accent) : theme.textSecondary,
                cursor: 'pointer',
                letterSpacing: 0.5,
              }}
            >
              {ind.name} ({ind.count})
            </button>
          ))}
        </div>
      )}

      {/* Event List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isTerminal ? 2 : 8 }}>
        {visibleEvents.map(event => (
          <LayoffEventCard key={event.id} event={event} theme={theme} themeId={themeId} />
        ))}
      </div>

      {/* Show more */}
      {filteredEvents.length > 5 && (
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
          {expanded ? 'Show less' : `Show ${filteredEvents.length - 5} more events`}
        </button>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: 12,
        fontSize: 10,
        color: theme.textTertiary,
        fontFamily: theme.fontMono,
        lineHeight: 1.5,
      }}>
        Data aggregated from Reddit, TechCrunch, Reuters, Hacker News, and Ars Technica.
        Employee counts are extracted from headlines and may be approximate. Updated hourly.
      </div>
    </div>
  )
}

// ── Individual Event Card ──────────────────────────────────

function LayoffEventCard({ event, theme, themeId }: {
  event: LayoffEvent
  theme: ThemeConfig
  themeId: string
}) {
  const isTerminal = themeId === 'terminal'
  const isBriefing = themeId === 'briefing'
  const industryColor = INDUSTRY_COLORS[event.industry] || '#9ca3af'

  return (
    <a
      href={event.source_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        textDecoration: 'none',
        padding: isTerminal ? '10px 12px' : '14px 16px',
        background: isBriefing ? '#fff' : theme.surface,
        border: `1px solid ${theme.surfaceBorder}`,
        borderRadius: isTerminal ? 2 : 8,
        borderLeft: isBriefing ? `3px solid ${industryColor}` : undefined,
        transition: 'border-color 0.15s',
      }}
    >
      {/* Top row: company + count + time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Company badge */}
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: theme.text,
            fontFamily: theme.fontMono,
            padding: isTerminal ? '1px 4px' : '2px 8px',
            background: isTerminal ? `${industryColor}20` : `${industryColor}10`,
            borderRadius: isTerminal ? 2 : 4,
            border: isTerminal ? `1px solid ${industryColor}40` : 'none',
          }}>
            {event.company}
          </span>

          {/* Employee count */}
          {event.count && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#ef4444',
              fontFamily: theme.fontMono,
            }}>
              -{formatNumber(event.count)}
            </span>
          )}

          {/* Industry tag */}
          <span style={{
            fontSize: 9,
            color: industryColor,
            fontFamily: theme.fontMono,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {event.industry}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9,
            color: event.source === 'reddit' ? '#ff4500' : theme.textTertiary,
            fontFamily: theme.fontMono,
          }}>
            {event.source_name}
          </span>
          <span style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono }}>
            {timeAgo(event.published_at)}
          </span>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        fontSize: isTerminal ? 13 : 14,
        fontWeight: 600,
        color: theme.text,
        lineHeight: 1.4,
        marginBottom: event.excerpt ? 4 : 0,
        fontFamily: isTerminal ? theme.fontMono : theme.fontBody,
      }}>
        {event.headline}
      </div>

      {/* Excerpt */}
      {event.excerpt && (
        <div style={{
          fontSize: 12,
          color: theme.textSecondary,
          lineHeight: 1.5,
          fontFamily: theme.fontBody,
        }}>
          {event.excerpt.slice(0, 160)}{event.excerpt.length > 160 ? '...' : ''}
        </div>
      )}
    </a>
  )
}
