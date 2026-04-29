'use client'

import { useTheme } from '@/lib/theme'
import type { DataSourceSummary } from './page'

interface Props {
  summaries: DataSourceSummary[]
  lastRunAt: string | null
}

const STATUS_LABEL: Record<DataSourceSummary['status'], string> = {
  ok: 'Operational',
  degraded: 'Degraded',
  failed: 'Failing',
  unknown: 'Unknown',
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) return 'in the future'
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

function formatUptime(u: number | null): string {
  if (u === null || u === undefined) return '—'
  return `${(u * 100).toFixed(1)}%`
}

export default function DataSourcesView({ summaries, lastRunAt }: Props) {
  const { theme, themeId } = useTheme()

  const okCount = summaries.filter(s => s.status === 'ok').length
  const total = summaries.length
  const overallConfidence = total > 0 ? Math.round((okCount / total) * 100) : 0

  const statusColor = (s: DataSourceSummary['status']) => {
    switch (s) {
      case 'ok': return '#22c55e'
      case 'degraded': return '#f59e0b'
      case 'failed': return '#dc2626'
      default: return theme.textSecondary
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: themeId === 'terminal' ? 4 : 10,
    padding: '24px 28px',
    marginBottom: 20,
  }

  const h2Style: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: theme.text,
    fontFamily: theme.fontHeading,
    margin: '0 0 16px',
  }

  const pStyle: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.7,
    color: theme.textSecondary,
    fontFamily: theme.fontBody,
    margin: '0 0 10px',
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', paddingTop: 48, paddingBottom: 48 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.text, fontFamily: theme.fontHeading, margin: '0 0 12px' }}>
            Data Sources
          </h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, fontFamily: theme.fontBody, lineHeight: 1.6, margin: 0 }}>
            Live operational status for every external data source feeding The Human Index. Updated each cron run.
          </p>
        </div>

        {/* Overview tile */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 38, fontWeight: 300, color: theme.text, fontFamily: theme.fontHeading, lineHeight: 1 }}>
              {total === 0 ? '—' : `${okCount}/${total}`}
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Sources operational · {overallConfidence}% confidence
            </div>
          </div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontBody }}>
            {lastRunAt
              ? <>Last refresh: <span style={{ fontFamily: theme.fontMono }}>{relativeTime(lastRunAt)}</span> · Vercel Cron runs daily at 06:00 UTC</>
              : 'Awaiting first cron run.'}
          </div>
        </div>

        {/* Source list */}
        {summaries.length === 0 ? (
          <div style={sectionStyle}>
            <h2 style={h2Style}>No data yet</h2>
            <p style={pStyle}>
              Health logging starts after the next Vercel Cron refresh. Once the cron runs, every source will appear here
              with its status, last successful fetch, 30-day uptime, and the THI domains it feeds.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summaries.map(s => (
              <div key={s.source} style={sectionStyle}>
                {/* Top row: name + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <h2 style={{ ...h2Style, margin: 0, marginBottom: 4 }}>{s.source}</h2>
                    {s.domains.length > 0 && (
                      <div style={{ fontSize: 12, color: theme.textSecondary, fontFamily: theme.fontMono, letterSpacing: 0.4 }}>
                        Feeds: {s.domains.join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px',
                    borderRadius: themeId === 'terminal' ? 3 : 999,
                    background: `${statusColor(s.status)}1a`,
                    color: statusColor(s.status),
                    fontSize: 12,
                    fontFamily: theme.fontMono,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(s.status), display: 'inline-block' }} />
                    {STATUS_LABEL[s.status]}
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 14,
                  fontFamily: theme.fontMono,
                }}>
                  <Stat label="Last success" value={relativeTime(s.lastSuccessAt)} theme={theme} />
                  <Stat label="30d uptime" value={formatUptime(s.uptime30d)} theme={theme} />
                  <Stat label="Data points" value={s.dataPoints.toString()} theme={theme} />
                  <Stat label="Fetch time" value={s.durationMs != null ? `${s.durationMs}ms` : '—'} theme={theme} />
                </div>

                {/* Error (if any) */}
                {s.lastError && s.status !== 'ok' && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    background: themeId === 'terminal' ? 'rgba(220,38,38,0.08)' : '#fef2f2',
                    border: `1px solid ${statusColor(s.status)}33`,
                    borderRadius: themeId === 'terminal' ? 3 : 6,
                    fontSize: 12,
                    fontFamily: theme.fontMono,
                    color: statusColor(s.status),
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}>
                    {s.lastError}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div style={{ ...sectionStyle, marginTop: 24 }}>
          <h2 style={h2Style}>How we use this</h2>
          <p style={pStyle}>
            Composite scores are weighted by the domains each operational source feeds. When a source fails, the affected
            domain&apos;s score is computed from the remaining sources and flagged in the score metadata. Static reference
            sources (Stanford AI Index, OECD, CDC) are bundled with the codebase and refreshed annually — they show 100%
            uptime by design.
          </p>
          <p style={{ ...pStyle, margin: 0 }}>
            For the full methodology, see <a href="/methodology" style={{ color: theme.accent }}>Methodology</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, color: theme.text, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}
