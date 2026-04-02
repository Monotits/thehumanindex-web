'use client'

import { Domain, DOMAIN_LABELS } from '@/lib/types'
import { CardTheme, CardOrientation, getScoreColor, getScoreBand } from './cardStyles'

// ── Card data types ───────────────────────────────

export interface CompositeCardData {
  type: 'composite'
  score: number
  delta: number | null
  domains: { domain: Domain; score: number }[]
  date: string
}

export interface DomainCardData {
  type: 'domain'
  domain: Domain
  score: number
  delta: number | null
  headline: string
  date: string
}

export interface PulseCardData {
  type: 'pulse'
  title: string
  excerpt: string
  compositeScore: number | null
  date: string
}

export interface QuizCardData {
  type: 'quiz'
  jobTitle: string
  band: string
  percentile: number
  topRisks: string[]
}

export interface TrendCardData {
  type: 'trend'
  title: string
  domains: { domain: Domain; score: number; delta: number }[]
  compositeScore: number
  date: string
}

export interface OverviewCardData {
  type: 'overview'
  compositeScore: number
  compositeChange: number | null
  band: string
  topDomains: { domain: Domain; score: number; delta: number }[]
  date: string
  weekNumber: number
}

export interface LayoffCardData {
  type: 'layoff'
  totalAffected: string
  topCompanies: { name: string; count: string; reason: string }[]
  date: string
}

export type ShareCardData = CompositeCardData | DomainCardData | PulseCardData | QuizCardData | TrendCardData | OverviewCardData | LayoffCardData

// ── SAFE FONTS for html2canvas ───────────────────────────────
// html2canvas cannot render custom web fonts reliably.
// We use only system-safe fonts that exist on every OS.
const FONT_BODY = 'Helvetica, Arial, sans-serif'
const FONT_MONO = '"Courier New", Courier, monospace'
const FONT_HEADING = 'Georgia, "Times New Roman", serif'

// ── Shared sub-components ───────────────────────────────

function HourglassLogo({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 25 40" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <rect x="2" y="1" width="21" height="4" rx="1.5" fill={color} />
      <rect x="2" y="35" width="21" height="4" rx="1.5" fill={color} />
      <path d="M4 5 C4 5, 4 16, 12.5 20 C21 16, 21 5, 21 5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M4 35 C4 35, 4 24, 12.5 20 C21 24, 21 35, 21 35" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="12.5" cy="20" r="1.5" fill={color} />
    </svg>
  )
}

function Branding({ theme, big = false }: { theme: CardTheme; big?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: big ? 12 : 8 }}>
      <HourglassLogo color={theme.accent} size={big ? 22 : 16} />
      <div>
        <div style={{ fontSize: big ? 20 : 15, fontWeight: 700, color: theme.text, fontFamily: FONT_BODY, letterSpacing: 2, lineHeight: 1.1 }}>
          THE HUMAN INDEX
        </div>
        <div style={{ fontSize: big ? 11 : 9, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginTop: 3 }}>
          thehumanindex.org
        </div>
      </div>
    </div>
  )
}

function ScoreBadge({ score, theme, size = 120 }: { score: number; theme: CardTheme; size?: number }) {
  const color = getScoreColor(score, theme)
  const band = getScoreBand(score)
  const fs = Math.round(size * 0.38)
  const bs = Math.round(size * 0.1)

  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`,
      border: `3px solid ${color}50`,
    }}>
      <div style={{ fontSize: fs, fontWeight: 800, color, fontFamily: FONT_MONO, lineHeight: 1, marginBottom: 4 }}>
        {score.toFixed(1)}
      </div>
      <div style={{ fontSize: bs, fontWeight: 700, color, fontFamily: FONT_MONO, letterSpacing: 2 }}>
        {band}
      </div>
    </div>
  )
}

function DomainBarRow({ label, score, theme, barHeight = 10, fontSize = 12 }: {
  label: string; score: number; theme: CardTheme; barHeight?: number; fontSize?: number
}) {
  const color = getScoreColor(score, theme)
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: barHeight + 4 }}>
      <div style={{
        width: 140, fontSize: fontSize - 1, color: theme.textSecondary,
        fontFamily: FONT_MONO, textAlign: 'right', paddingRight: 16, flexShrink: 0,
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: barHeight, background: `${theme.textMuted}30`, borderRadius: barHeight / 2, overflow: 'hidden', marginRight: 16 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: barHeight / 2 }} />
      </div>
      <div style={{ width: 40, fontSize, fontWeight: 700, color, fontFamily: FONT_MONO, textAlign: 'right', flexShrink: 0 }}>
        {score}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────

function getCardDimensions(orientation: CardOrientation) {
  return orientation === 'horizontal'
    ? { w: 1200, h: 630 }
    : { w: 1080, h: 1920 }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen - 3).trim() + '...'
}

// Standard card wrapper
function CardWrap({ theme, orientation, children }: {
  theme: CardTheme; orientation: CardOrientation; children: React.ReactNode
}) {
  const { w, h } = getCardDimensions(orientation)
  const pad = orientation === 'horizontal' ? 48 : 64
  return (
    <div style={{
      width: w, height: h,
      background: theme.bgGradient,
      padding: pad,
      fontFamily: FONT_BODY,
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${theme.text} 1px, transparent 1px), linear-gradient(90deg, ${theme.text} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

function CardHeader({ theme, label, date, big }: { theme: CardTheme; label: string; date: string; big?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0 }}>
      <Branding theme={theme} big={big} />
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: big ? 13 : 11, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2 }}>{label}</div>
        <div style={{ fontSize: big ? 15 : 13, color: theme.textSecondary, fontFamily: FONT_MONO, marginTop: 4 }}>{date}</div>
      </div>
    </div>
  )
}

function CardFooter({ theme, text, big }: { theme: CardTheme; text: string; big?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', flexShrink: 0 }}>
      <div style={{ fontSize: big ? 15 : 13, color: theme.textMuted, fontStyle: 'italic', fontFamily: FONT_BODY }}>
        {text}
      </div>
      <div style={{ fontSize: big ? 13 : 11, color: theme.textMuted, fontFamily: FONT_MONO }}>thehumanindex.org</div>
    </div>
  )
}

// ── Card Templates ───────────────────────────────

function CompositeCard({ data, theme, orientation = 'horizontal' }: { data: CompositeCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'
  const sortedDomains = [...data.domains].sort((a, b) => b.score - a.score)

  if (isV) {
    return (
      <CardWrap theme={theme} orientation={orientation}>
        <CardHeader theme={theme} label="COMPOSITE INDEX" date={data.date} big />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48, position: 'relative' }}>
          <ScoreBadge score={data.score} theme={theme} size={200} />
          {data.delta !== null && (
            <div style={{
              fontSize: 24, fontWeight: 700, fontFamily: FONT_MONO,
              color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
            }}>
              {data.delta > 0 ? '+' : ''}{data.delta.toFixed(1)} pts from last week
            </div>
          )}
          <div style={{ width: '100%', maxWidth: 800, marginTop: 16 }}>
            <div style={{ fontSize: 14, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 24, textAlign: 'center' }}>
              DOMAIN READINGS
            </div>
            {sortedDomains.map(d => (
              <DomainBarRow key={d.domain} label={DOMAIN_LABELS[d.domain]} score={d.score} theme={theme} barHeight={14} fontSize={15} />
            ))}
          </div>
        </div>
        <CardFooter theme={theme} text="Measuring civilizational stress in the age of AI" big />
      </CardWrap>
    )
  }

  return (
    <CardWrap theme={theme} orientation={orientation}>
      <CardHeader theme={theme} label="COMPOSITE INDEX" date={data.date} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 56, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ScoreBadge score={data.score} theme={theme} size={130} />
          {data.delta !== null && (
            <div style={{
              fontSize: 15, fontWeight: 700, fontFamily: FONT_MONO,
              color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
            }}>
              {data.delta > 0 ? '+' : ''}{data.delta.toFixed(1)} pts
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 16 }}>DOMAIN READINGS</div>
          {sortedDomains.map(d => (
            <DomainBarRow key={d.domain} label={DOMAIN_LABELS[d.domain].split(' ').slice(0, 2).join(' ')} score={d.score} theme={theme} />
          ))}
        </div>
      </div>
      <CardFooter theme={theme} text="Measuring civilizational stress in the age of AI" />
    </CardWrap>
  )
}

function DomainCard({ data, theme, orientation = 'horizontal' }: { data: DomainCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'
  const color = getScoreColor(data.score, theme)
  const band = getScoreBand(data.score)

  return (
    <CardWrap theme={theme} orientation={orientation}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <CardHeader theme={theme} label="DOMAIN REPORT" date={data.date} big={isV} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 32 : 20, position: 'relative' }}>
        <div style={{ fontSize: isV ? 16 : 12, color, fontFamily: FONT_MONO, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
          {DOMAIN_LABELS[data.domain]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: isV ? 100 : 80, fontWeight: 800, color, fontFamily: FONT_MONO, lineHeight: 1 }}>
            {data.score}
          </div>
          <div>
            <div style={{
              display: 'inline-block', padding: '8px 16px', borderRadius: 8,
              background: `${color}20`, border: `1px solid ${color}40`,
              fontSize: isV ? 18 : 14, fontWeight: 700, color, fontFamily: FONT_MONO, letterSpacing: 2,
            }}>
              {band}
            </div>
            {data.delta !== null && (
              <div style={{
                fontSize: isV ? 20 : 16, fontWeight: 700, fontFamily: FONT_MONO,
                color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
                marginTop: 10,
              }}>
                {data.delta > 0 ? '+' : ''}{data.delta.toFixed(1)} from last week
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: isV ? 22 : 18, color: theme.textSecondary, lineHeight: 1.6, maxWidth: isV ? 900 : 700, fontFamily: FONT_BODY }}>
          {truncate(data.headline, isV ? 200 : 140)}
        </div>
        {/* Score bar */}
        <div style={{ maxWidth: isV ? 900 : 600 }}>
          <div style={{ height: isV ? 14 : 10, background: `${theme.textMuted}25`, borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: `${data.score}%`, height: '100%', background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 7 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: isV ? 11 : 9, color: theme.textMuted, fontFamily: FONT_MONO }}>
            <span>0 - LOW</span>
            <span>100 - CRITICAL</span>
          </div>
        </div>
      </div>
      <CardFooter theme={theme} text="Measuring civilizational stress in the age of AI" big={isV} />
    </CardWrap>
  )
}

function PulseCard({ data, theme, orientation = 'horizontal' }: { data: PulseCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'
  // Truncate excerpt to fit card without overflow
  const maxExcerpt = isV ? 400 : 180

  return (
    <CardWrap theme={theme} orientation={orientation}>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: theme.accent, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0 }}>
        <Branding theme={theme} big={isV} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 6,
            background: `${theme.accent}20`,
            fontSize: isV ? 14 : 11, fontWeight: 700, color: theme.accent, fontFamily: FONT_MONO, letterSpacing: 2,
          }}>
            WEEKLY PULSE
          </div>
          <div style={{ fontSize: isV ? 15 : 13, color: theme.textSecondary, fontFamily: FONT_MONO }}>{data.date}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 40 : 24, position: 'relative' }}>
        <h2 style={{
          fontSize: isV ? 52 : 36, fontWeight: 700, color: theme.text,
          fontFamily: FONT_HEADING, lineHeight: 1.25, margin: 0,
          maxWidth: isV ? 900 : 1000,
        }}>
          {truncate(data.title, isV ? 100 : 70)}
        </h2>
        <p style={{
          fontSize: isV ? 22 : 17, color: theme.textSecondary, lineHeight: 1.7, margin: 0,
          maxWidth: isV ? 900 : 900, fontFamily: FONT_BODY,
        }}>
          {truncate(data.excerpt, maxExcerpt)}
        </p>
        {isV && data.compositeScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <span style={{ fontSize: 16, color: theme.textMuted, fontFamily: FONT_MONO }}>INDEX SCORE:</span>
            <span style={{
              fontSize: 40, fontWeight: 800,
              color: getScoreColor(data.compositeScore, theme),
              fontFamily: FONT_MONO,
            }}>
              {data.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', flexShrink: 0 }}>
        <div style={{ fontSize: isV ? 15 : 13, color: theme.textMuted, fontStyle: 'italic', fontFamily: FONT_BODY }}>
          Read the full analysis at thehumanindex.org/pulse
        </div>
        {!isV && data.compositeScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: FONT_MONO }}>INDEX:</span>
            <span style={{
              fontSize: 22, fontWeight: 800,
              color: getScoreColor(data.compositeScore, theme),
              fontFamily: FONT_MONO,
            }}>
              {data.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </CardWrap>
  )
}

function QuizCard({ data, theme, orientation = 'horizontal' }: { data: QuizCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'
  const bandColor = data.band === 'critical' ? theme.scoreColors.critical
    : data.band === 'high' ? theme.scoreColors.high
    : data.band === 'elevated' ? theme.scoreColors.elevated
    : data.band === 'moderate' ? theme.scoreColors.moderate
    : theme.scoreColors.low

  const circleSize = isV ? 220 : 160

  return (
    <CardWrap theme={theme} orientation={orientation}>
      {/* Glow */}
      <div style={{
        position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${bandColor}12, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0 }}>
        <Branding theme={theme} big={isV} />
        <div style={{
          padding: '6px 14px', borderRadius: 6,
          background: `${theme.accent}20`,
          fontSize: isV ? 14 : 11, fontWeight: 700, color: theme.accent, fontFamily: FONT_MONO, letterSpacing: 2,
        }}>
          AI EXPOSURE QUIZ
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isV ? 'column' : 'row',
        alignItems: 'center',
        gap: isV ? 48 : 48,
        position: 'relative',
        justifyContent: 'center',
      }}>
        {/* Percentile circle + band */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: circleSize,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `${bandColor}15`,
            border: `3px solid ${bandColor}40`,
          }}>
            <div style={{ fontSize: isV ? 18 : 14, color: theme.textMuted, fontFamily: FONT_MONO, marginBottom: 6 }}>PERCENTILE</div>
            <div style={{ fontSize: isV ? 72 : 52, fontWeight: 800, color: bandColor, fontFamily: FONT_MONO, lineHeight: 1 }}>
              {data.percentile}
            </div>
          </div>
          <div style={{
            padding: '8px 20px', borderRadius: 8,
            background: `${bandColor}20`, border: `1px solid ${bandColor}40`,
            fontSize: isV ? 18 : 14, fontWeight: 700, color: bandColor, fontFamily: FONT_MONO, letterSpacing: 2,
          }}>
            {data.band.toUpperCase()}
          </div>
        </div>

        {/* Job + risks */}
        <div style={{ flex: isV ? undefined : 1, width: isV ? '100%' : undefined, textAlign: isV ? 'center' : 'left' }}>
          <div style={{ fontSize: isV ? 16 : 14, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 8 }}>MY ROLE</div>
          <div style={{
            fontSize: isV ? 38 : 28, fontWeight: 700, color: theme.text, fontFamily: FONT_HEADING,
            marginBottom: isV ? 32 : 24, lineHeight: 1.2,
          }}>
            {truncate(data.jobTitle, 40)}
          </div>

          {data.topRisks.length > 0 && (
            <div style={{ textAlign: 'left', maxWidth: isV ? 700 : undefined, margin: isV ? '0 auto' : undefined }}>
              <div style={{ fontSize: isV ? 13 : 11, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 12 }}>TOP TASKS AT RISK</div>
              {data.topRisks.slice(0, 3).map((risk, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < 2 ? `1px solid ${theme.textMuted}20` : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${bandColor}20`,
                    fontSize: 12, fontWeight: 700, color: bandColor, fontFamily: FONT_MONO,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: isV ? 18 : 15, color: theme.textSecondary, fontFamily: FONT_BODY }}>
                    {truncate(risk, 50)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CardFooter theme={theme} text="Take the quiz at thehumanindex.org/quiz" big={isV} />
    </CardWrap>
  )
}

function TrendCard({ data, theme, orientation = 'horizontal' }: { data: TrendCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'
  const sortedDomains = [...data.domains].sort((a, b) => b.score - a.score)

  return (
    <CardWrap theme={theme} orientation={orientation}>
      <CardHeader theme={theme} label="DOMAIN TRENDS" date={data.date} big={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 32 : 20, position: 'relative' }}>
        <h2 style={{
          fontSize: isV ? 48 : 30, fontWeight: 700, color: theme.text,
          fontFamily: FONT_HEADING, lineHeight: 1.2, margin: 0,
        }}>
          {data.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isV ? 24 : 14, marginTop: isV ? 24 : 12, maxWidth: isV ? 900 : undefined }}>
          {sortedDomains.map(d => {
            const color = getScoreColor(d.score, theme)
            const deltaColor = d.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low
            return (
              <div key={d.domain} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: isV ? 180 : 130, fontSize: isV ? 14 : 12, color: theme.textSecondary,
                  fontFamily: FONT_MONO, fontWeight: 600, flexShrink: 0, paddingRight: 12,
                  textAlign: 'right', overflow: 'hidden', whiteSpace: 'nowrap',
                }}>
                  {DOMAIN_LABELS[d.domain].split(' ').slice(0, 2).join(' ')}
                </div>
                <div style={{ flex: 1, height: isV ? 16 : 12, background: `${theme.textMuted}30`, borderRadius: 8, overflow: 'hidden', marginRight: 16 }}>
                  <div style={{ width: `${d.score}%`, height: '100%', background: color, borderRadius: 8 }} />
                </div>
                <div style={{ width: isV ? 70 : 50, textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                  <span style={{ fontSize: isV ? 16 : 13, fontWeight: 700, color, fontFamily: FONT_MONO }}>
                    {d.score}
                  </span>
                </div>
                <div style={{ width: isV ? 60 : 45, textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: isV ? 13 : 10, fontWeight: 600, color: deltaColor, fontFamily: FONT_MONO }}>
                    {d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', flexShrink: 0 }}>
        <div style={{ fontSize: isV ? 15 : 13, color: theme.textMuted, fontStyle: 'italic', fontFamily: FONT_BODY }}>
          Measuring civilizational stress in the age of AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: isV ? 13 : 11, color: theme.textMuted, fontFamily: FONT_MONO }}>COMPOSITE:</span>
          <span style={{ fontSize: isV ? 28 : 20, fontWeight: 800, color: getScoreColor(data.compositeScore, theme), fontFamily: FONT_MONO }}>
            {data.compositeScore.toFixed(1)}
          </span>
        </div>
      </div>
    </CardWrap>
  )
}

function OverviewCard({ data, theme, orientation = 'horizontal' }: { data: OverviewCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'
  const sortedDomains = [...data.topDomains].sort((a, b) => b.score - a.score)
  const scoreColor = getScoreColor(data.compositeScore, theme)

  return (
    <CardWrap theme={theme} orientation={orientation}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -150, right: -150,
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${scoreColor}12, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <CardHeader theme={theme} label="WEEKLY OVERVIEW" date={data.date} big={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isV ? 48 : 24, position: 'relative' }}>
        {/* Hero score */}
        <ScoreBadge score={data.compositeScore} theme={theme} size={isV ? 200 : 130} />
        {data.compositeChange !== null && (
          <div style={{
            fontSize: isV ? 22 : 16, fontWeight: 700, fontFamily: FONT_MONO,
            color: data.compositeChange > 0 ? theme.scoreColors.high : theme.scoreColors.low,
          }}>
            {data.compositeChange > 0 ? '+' : ''}{data.compositeChange.toFixed(1)} pts from last week
          </div>
        )}

        {/* Domain bars */}
        <div style={{ width: '100%', maxWidth: isV ? 800 : 600 }}>
          <div style={{ fontSize: isV ? 13 : 11, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>
            TOP DOMAIN READINGS
          </div>
          {sortedDomains.slice(0, isV ? 5 : 3).map(d => (
            <DomainBarRow key={d.domain} label={DOMAIN_LABELS[d.domain]} score={d.score} theme={theme}
              barHeight={isV ? 14 : 10} fontSize={isV ? 14 : 12} />
          ))}
        </div>

        {/* Band badge */}
        <div style={{
          display: 'inline-block', padding: isV ? '10px 24px' : '8px 20px', borderRadius: 8,
          background: `${scoreColor}20`, border: `1px solid ${scoreColor}40`,
          fontSize: isV ? 18 : 14, fontWeight: 700, color: scoreColor, fontFamily: FONT_MONO, letterSpacing: 2,
        }}>
          {data.band.toUpperCase()}
        </div>
      </div>

      <CardFooter theme={theme} text={`Week ${data.weekNumber} • Measuring civilizational stress in the age of AI`} big={isV} />
    </CardWrap>
  )
}

function LayoffCard({ data, theme, orientation = 'horizontal' }: { data: LayoffCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const isV = orientation === 'vertical'

  return (
    <CardWrap theme={theme} orientation={orientation}>
      {/* Red glow */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.scoreColors.critical}15, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <CardHeader theme={theme} label="LAYOFF TRACKER" date={data.date} big={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 48 : 24, position: 'relative' }}>
        {/* Big number */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: isV ? 18 : 14, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 12 }}>AFFECTED WORKERS</div>
          <div style={{
            fontSize: isV ? 96 : 64, fontWeight: 800, color: theme.scoreColors.critical,
            fontFamily: FONT_MONO, lineHeight: 1,
          }}>
            {data.totalAffected}
          </div>
        </div>

        {/* Companies */}
        <div style={{ maxWidth: isV ? 800 : undefined, margin: isV ? '0 auto' : undefined, width: isV ? '100%' : undefined }}>
          <div style={{ fontSize: isV ? 13 : 11, color: theme.textMuted, fontFamily: FONT_MONO, letterSpacing: 2, marginBottom: 16 }}>
            TOP COMPANIES
          </div>
          {data.topCompanies.slice(0, isV ? 5 : 3).map((company, i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: isV ? '16px 0' : '12px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${theme.textMuted}20` : 'none',
            }}>
              <div>
                <div style={{ fontSize: isV ? 18 : 14, fontWeight: 700, color: theme.text, fontFamily: FONT_BODY }}>
                  {company.name}
                </div>
                <div style={{ fontSize: isV ? 14 : 12, color: theme.textSecondary, marginTop: 4, fontFamily: FONT_BODY }}>
                  {company.reason}
                </div>
              </div>
              <div style={{ fontSize: isV ? 16 : 13, fontWeight: 700, color: theme.scoreColors.critical, fontFamily: FONT_MONO, flexShrink: 0, paddingLeft: 16 }}>
                {company.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CardFooter theme={theme} text="Tracking workforce changes in tech" big={isV} />
    </CardWrap>
  )
}

// ── Main Renderer ───────────────────────────────

export function ShareCardRenderer({ data, theme, orientation = 'horizontal' }: { data: ShareCardData; theme: CardTheme; orientation?: CardOrientation }) {
  switch (data.type) {
    case 'composite':
      return <CompositeCard data={data} theme={theme} orientation={orientation} />
    case 'domain':
      return <DomainCard data={data} theme={theme} orientation={orientation} />
    case 'pulse':
      return <PulseCard data={data} theme={theme} orientation={orientation} />
    case 'quiz':
      return <QuizCard data={data} theme={theme} orientation={orientation} />
    case 'trend':
      return <TrendCard data={data} theme={theme} orientation={orientation} />
    case 'overview':
      return <OverviewCard data={data} theme={theme} orientation={orientation} />
    case 'layoff':
      return <LayoffCard data={data} theme={theme} orientation={orientation} />
  }
}
