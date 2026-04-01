'use client'

import { useEffect, useState } from 'react'
import { useTheme, ThemeConfig } from '@/lib/theme'
import { CorporateLayoffSummary, CorporateLayoff, LayoffReason } from '@/lib/corporateLayoffs'

const REASON_LABELS: Record<LayoffReason, { label: string; color: string; bg: string }> = {
  AI_DRIVEN: { label: 'AI-DRIVEN', color: '#ef4444', bg: '#ef444418' },
  AUTOMATION: { label: 'AUTOMATION', color: '#f97316', bg: '#f9731618' },
  RESTRUCTURING: { label: 'RESTRUCTURING', color: '#8b5cf6', bg: '#8b5cf618' },
  WEAK_DEMAND: { label: 'WEAK DEMAND', color: '#f59e0b', bg: '#f59e0b18' },
  COST_CUTTING: { label: 'COST CUTTING', color: '#06b6d4', bg: '#06b6d418' },
  MERGER: { label: 'MERGER', color: '#3b82f6', bg: '#3b82f618' },
  MARKET_SHIFT: { label: 'MARKET SHIFT', color: '#10b981', bg: '#10b98118' },
}

const INDUSTRY_COLORS: Record<string, string> = {
  'Tech': '#3b82f6', 'Banking': '#10b981', 'Finance': '#10b981', 'Fintech': '#06b6d4',
  'Automotive': '#f97316', 'Semiconductors': '#8b5cf6', 'Enterprise Software': '#6366f1',
  'Entertainment': '#ec4899', 'Consulting': '#14b8a6', 'Logistics': '#f59e0b',
  'Aerospace': '#6366f1', 'Healthcare': '#ef4444', 'Energy': '#eab308',
  'Tech/Retail': '#3b82f6', 'Tech/Transport': '#3b82f6', 'E-commerce': '#84cc16',
  'Social Media': '#ec4899', 'Gaming': '#ec4899', 'Telecom': '#14b8a6',
  'Industrial': '#78716c', 'Crypto': '#f59e0b', 'Other': '#9ca3af',
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toLocaleString()
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'Today'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type SortField = 'people' | 'percent' | 'date' | 'company'
type SortDir = 'asc' | 'desc'

export default function CorporateLayoffTable() {
  const { theme, themeId } = useTheme()
  const [data, setData] = useState<CorporateLayoffSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('people')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/corporate-layoffs')
      .then(r => r.json())
      .then((d: CorporateLayoffSummary) => {
        if (d.layoffs?.length > 0) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isTerminal = themeId === 'terminal'
  const isBriefing = themeId === 'briefing'

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: theme.textTertiary, fontSize: 13, fontFamily: theme.fontMono }}>
        Loading corporate layoff data...
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: theme.textTertiary, fontSize: 13, fontFamily: theme.fontMono }}>
        No corporate layoff data available.
      </div>
    )
  }

  // Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...data.layoffs]
    .filter(l => !filterIndustry || l.industry === filterIndustry)
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1
      switch (sortField) {
        case 'people': return (a.peopleAffected - b.peopleAffected) * dir
        case 'percent': return ((a.workforcePercent || 0) - (b.workforcePercent || 0)) * dir
        case 'date': return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir
        case 'company': return a.company.localeCompare(b.company) * -dir
        default: return 0
      }
    })

  const visible = showAll ? sorted : sorted.slice(0, 10)
  const industries = Array.from(new Set(data.layoffs.map(l => l.industry))).sort()

  return (
    <div>
      {/* Section Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{
              fontSize: isTerminal ? 13 : 20,
              fontWeight: isTerminal ? 400 : 700,
              color: theme.text,
              margin: '0 0 6px',
              fontFamily: isTerminal ? theme.fontMono : theme.fontHeading,
              textTransform: isTerminal ? 'uppercase' : 'none',
              letterSpacing: isTerminal ? 2 : 0,
            }}>
              {isTerminal ? '> CORPORATE LAYOFF TRACKER' : 'Corporate Layoff Tracker'}
            </h2>
            <p style={{
              fontSize: 13,
              color: theme.textSecondary,
              margin: 0,
              fontFamily: theme.fontBody,
            }}>
              Major workforce reductions at global companies
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {data.source === 'live' && (
              <span style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 3,
                background: '#22c55e20', color: '#22c55e',
                fontFamily: theme.fontMono, letterSpacing: 1, fontWeight: 600,
              }}>LIVE</span>
            )}
            <span style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 3,
              background: `${theme.accent}15`, color: theme.accent,
              fontFamily: theme.fontMono, letterSpacing: 1, fontWeight: 600,
            }}>{data.totalCompanies} COMPANIES</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}>
        <StatBox
          label="Total Affected"
          value={formatNumber(data.totalAffected)}
          color="#ef4444"
          theme={theme}
          isTerminal={isTerminal}
          isBriefing={isBriefing}
        />
        <StatBox
          label="Companies"
          value={data.totalCompanies.toString()}
          color={theme.accent}
          theme={theme}
          isTerminal={isTerminal}
          isBriefing={isBriefing}
        />
        <StatBox
          label="AI-Driven"
          value={`${data.aiDrivenPercent}%`}
          color="#f97316"
          theme={theme}
          isTerminal={isTerminal}
          isBriefing={isBriefing}
        />
        <StatBox
          label="Top Sector"
          value={data.topIndustries[0]?.name || '—'}
          color="#8b5cf6"
          theme={theme}
          isTerminal={isTerminal}
          isBriefing={isBriefing}
        />
      </div>

      {/* Industry Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <FilterChip
          label="All"
          active={!filterIndustry}
          onClick={() => setFilterIndustry(null)}
          theme={theme}
          isTerminal={isTerminal}
        />
        {industries.map(ind => (
          <FilterChip
            key={ind}
            label={ind}
            active={filterIndustry === ind}
            onClick={() => setFilterIndustry(filterIndustry === ind ? null : ind)}
            color={INDUSTRY_COLORS[ind]}
            theme={theme}
            isTerminal={isTerminal}
          />
        ))}
      </div>

      {/* Table */}
      <div style={{
        border: `1px solid ${theme.surfaceBorder}`,
        borderRadius: isTerminal ? 2 : 10,
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1.5fr 0.8fr',
          gap: 0,
          padding: '10px 16px',
          background: isTerminal ? '#0f0f0f' : isBriefing ? '#f0ebe3' : `${theme.surface}`,
          borderBottom: `1px solid ${theme.surfaceBorder}`,
        }}>
          <SortHeader label="Company" field="company" current={sortField} dir={sortDir} onSort={handleSort} theme={theme} />
          <SortHeader label="People" field="people" current={sortField} dir={sortDir} onSort={handleSort} theme={theme} align="right" />
          <SortHeader label="% Workforce" field="percent" current={sortField} dir={sortDir} onSort={handleSort} theme={theme} align="right" />
          <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, textTransform: 'uppercase', letterSpacing: 1, padding: '0 4px' }}>
            Tags
          </div>
          <SortHeader label="Date" field="date" current={sortField} dir={sortDir} onSort={handleSort} theme={theme} align="right" />
        </div>

        {/* Table Rows */}
        {visible.map((layoff, i) => (
          <LayoffRow
            key={`${layoff.company}-${i}`}
            layoff={layoff}
            theme={theme}
            isTerminal={isTerminal}
            isBriefing={isBriefing}
            isLast={i === visible.length - 1}
          />
        ))}
      </div>

      {/* Show more */}
      {sorted.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            display: 'block', width: '100%', padding: '10px 0', marginTop: 8,
            background: 'none', border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: isTerminal ? 2 : 6, color: theme.textSecondary,
            fontSize: 12, cursor: 'pointer', fontFamily: theme.fontMono,
          }}
        >
          {showAll ? 'Show less' : `Show all ${sorted.length} companies`}
        </button>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 12, fontSize: 10, color: theme.textTertiary,
        fontFamily: theme.fontMono, lineHeight: 1.5,
      }}>
        Data from WARN Act filings, Reddit, TechCrunch, Reuters, Hacker News. Workforce percentages are estimates based on most recent public headcount data. Updated daily.
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────

function StatBox({ label, value, color, theme, isTerminal, isBriefing }: {
  label: string; value: string; color: string; theme: ThemeConfig; isTerminal: boolean; isBriefing: boolean
}) {
  return (
    <div style={{
      padding: isTerminal ? '10px 12px' : '12px 14px',
      background: isBriefing ? '#fff' : theme.surface,
      border: `1px solid ${theme.surfaceBorder}`,
      borderRadius: isTerminal ? 2 : 8,
    }}>
      <div style={{
        fontSize: 9, color: theme.textTertiary, fontFamily: theme.fontMono,
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: isTerminal ? 18 : 20, fontWeight: 700,
        color, fontFamily: theme.fontMono,
      }}>{value}</div>
    </div>
  )
}

function FilterChip({ label, active, onClick, color, theme, isTerminal }: {
  label: string; active: boolean; onClick: () => void; color?: string; theme: ThemeConfig; isTerminal: boolean
}) {
  const c = color || theme.accent
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', fontSize: 11, fontFamily: theme.fontMono,
      border: `1px solid ${active ? c : theme.surfaceBorder}`,
      borderRadius: isTerminal ? 2 : 12,
      background: active ? `${c}15` : 'transparent',
      color: active ? c : theme.textSecondary,
      cursor: 'pointer', letterSpacing: 0.5,
    }}>
      {label}
    </button>
  )
}

function SortHeader({ label, field, current, dir, onSort, theme, align }: {
  label: string; field: SortField; current: SortField; dir: SortDir
  onSort: (f: SortField) => void; theme: ThemeConfig; align?: string
}) {
  const isActive = current === field
  return (
    <button
      onClick={() => onSort(field)}
      style={{
        fontSize: 10, color: isActive ? theme.accent : theme.textTertiary,
        fontFamily: theme.fontMono, textTransform: 'uppercase', letterSpacing: 1,
        background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
        display: 'flex', alignItems: 'center', gap: 4,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {label}
      {isActive && <span style={{ fontSize: 8 }}>{dir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  )
}

function LayoffRow({ layoff, theme, isTerminal, isBriefing, isLast }: {
  layoff: CorporateLayoff; theme: ThemeConfig; isTerminal: boolean; isBriefing: boolean; isLast: boolean
}) {
  const industryColor = INDUSTRY_COLORS[layoff.industry] || '#9ca3af'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1.5fr 0.8fr',
      gap: 0,
      padding: '12px 16px',
      background: isBriefing ? '#fff' : theme.surface,
      borderBottom: isLast ? 'none' : `1px solid ${theme.surfaceBorder}`,
      alignItems: 'center',
      transition: 'background 0.1s',
    }}>
      {/* Company + Industry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: theme.text,
            fontFamily: isTerminal ? theme.fontMono : theme.fontBody,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {layoff.company}
            {layoff.isNew && (
              <span style={{
                fontSize: 8, color: '#ef4444', fontFamily: theme.fontMono,
                fontWeight: 700, marginLeft: 6, verticalAlign: 'super',
                letterSpacing: 1,
              }}>NEW</span>
            )}
          </div>
          <div style={{
            fontSize: 11, color: industryColor, fontFamily: theme.fontMono,
            marginTop: 1,
          }}>
            {layoff.industry}
            {layoff.country !== 'Global' && (
              <span style={{ color: theme.textTertiary, marginLeft: 6 }}>
                {layoff.country}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* People Affected */}
      <div style={{ textAlign: 'right', paddingRight: 8 }}>
        <span style={{
          fontSize: isTerminal ? 14 : 15, fontWeight: 700,
          color: '#ef4444', fontFamily: theme.fontMono,
        }}>
          {formatNumber(layoff.peopleAffected)}
        </span>
      </div>

      {/* Workforce % */}
      <div style={{ textAlign: 'right', paddingRight: 8 }}>
        {layoff.workforcePercent ? (
          <div>
            <span style={{
              fontSize: 14, fontWeight: 600, color: theme.text, fontFamily: theme.fontMono,
            }}>
              {layoff.workforcePercent}%
            </span>
            {/* Mini bar */}
            <div style={{
              height: 3, borderRadius: 2, marginTop: 3,
              background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min(layoff.workforcePercent, 100)}%`,
                background: layoff.workforcePercent > 10 ? '#ef4444' : layoff.workforcePercent > 5 ? '#f59e0b' : '#3b82f6',
              }} />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: theme.textTertiary, fontFamily: theme.fontMono }}>—</span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 4px' }}>
        {layoff.reason.slice(0, 2).map(r => {
          const tag = REASON_LABELS[r]
          return (
            <span key={r} style={{
              fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
              padding: '2px 6px', borderRadius: isTerminal ? 2 : 3,
              color: tag.color, background: tag.bg,
              fontFamily: theme.fontMono, whiteSpace: 'nowrap',
            }}>
              {tag.label}
            </span>
          )
        })}
      </div>

      {/* Date + Source */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: theme.textSecondary, fontFamily: theme.fontMono }}>
          {formatDate(layoff.date)}
        </div>
        <a
          href={layoff.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 9, color: theme.textTertiary, fontFamily: theme.fontMono,
            textDecoration: 'none', opacity: 0.8,
          }}
        >
          {layoff.source}
        </a>
      </div>
    </div>
  )
}
