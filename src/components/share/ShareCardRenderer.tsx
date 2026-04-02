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

// ── Shared sub-components ───────────────────────────────

function HourglassLogo({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 25 40" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2" y="1" width="21" height="4" rx="1.5" fill={color} />
      <rect x="2" y="35" width="21" height="4" rx="1.5" fill={color} />
      <path d="M4 5 C4 5, 4 16, 12.5 20 C21 16, 21 5, 21 5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M4 35 C4 35, 4 24, 12.5 20 C21 24, 21 35, 21 35" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="12.5" cy="20" r="1.5" fill={color} />
    </svg>
  )
}

function Branding({ theme, size = 'normal' }: { theme: CardTheme; size?: 'normal' | 'small' }) {
  const fontSize = size === 'small' ? 13 : 16
  const logoSize = size === 'small' ? 12 : 16
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'small' ? 6 : 8 }}>
      <HourglassLogo color={theme.accent} size={logoSize} />
      <div>
        <div style={{ fontSize, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeading, letterSpacing: 1, lineHeight: 1 }}>
          THE HUMAN INDEX
        </div>
        <div style={{ fontSize: size === 'small' ? 8 : 9, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginTop: 2 }}>
          thehumanindex.org
        </div>
      </div>
    </div>
  )
}

function ScoreBadge({ score, theme, size = 'large' }: { score: number; theme: CardTheme; size?: 'large' | 'medium' | 'small' }) {
  const color = getScoreColor(score, theme)
  const band = getScoreBand(score)
  const dims = size === 'large' ? { w: 120, h: 120, fs: 48, bs: 12 } : size === 'medium' ? { w: 80, h: 80, fs: 32, bs: 10 } : { w: 56, h: 56, fs: 22, bs: 8 }

  return (
    <div style={{
      width: dims.w, height: dims.h, borderRadius: dims.w / 2,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`,
      border: `2px solid ${color}50`,
      boxShadow: `0 0 40px ${color}20`,
    }}>
      <div style={{ fontSize: dims.fs, fontWeight: 800, color, fontFamily: theme.fontMono, lineHeight: 1 }}>
        {score.toFixed(1)}
      </div>
      <div style={{ fontSize: dims.bs, fontWeight: 600, color, fontFamily: theme.fontMono, letterSpacing: 2, marginTop: 4 }}>
        {band}
      </div>
    </div>
  )
}

function DomainBar({ domain, score, theme }: { domain: Domain; score: number; theme: CardTheme }) {
  const color = getScoreColor(score, theme)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 90, fontSize: 10, color: theme.textSecondary, fontFamily: theme.fontMono, textAlign: 'right', flexShrink: 0 }}>
        {DOMAIN_LABELS[domain].split(' ').slice(0, 2).join(' ')}
      </div>
      <div style={{ flex: 1, height: 8, background: `${theme.textMuted}30`, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <div style={{ width: 30, fontSize: 11, fontWeight: 700, color, fontFamily: theme.fontMono, textAlign: 'right' }}>
        {score}
      </div>
    </div>
  )
}

// ── Card Templates ───────────────────────────────

function getCardDimensions(orientation: CardOrientation) {
  return orientation === 'horizontal'
    ? { width: 1200, height: 630 }
    : { width: 1080, height: 1920 }
}

function CompositeCard({ data, theme, orientation = 'horizontal' }: { data: CompositeCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)
  const sortedDomains = [...data.domains].sort((a, b) => b.score - a.score)

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: 48,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(${theme.text} 1px, transparent 1px), linear-gradient(90deg, ${theme.text} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Top: branding + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2 }}>COMPOSITE INDEX</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, marginTop: 4 }}>{data.date}</div>
        </div>
      </div>

      {/* Middle: score + domains */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 64, position: 'relative' }}>
        {/* Left: big score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <ScoreBadge score={data.score} theme={theme} size="large" />
          {data.delta !== null && (
            <div style={{
              fontSize: 16, fontWeight: 600,
              fontFamily: theme.fontMono,
              color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
            }}>
              {data.delta > 0 ? '▲' : '▼'} {Math.abs(data.delta).toFixed(1)} pts
            </div>
          )}
        </div>

        {/* Right: domain bars */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 16 }}>
            DOMAIN READINGS
          </div>
          {sortedDomains.map(d => (
            <DomainBar key={d.domain} domain={d.domain} score={d.score} theme={theme} />
          ))}
        </div>
      </div>

      {/* Bottom: tagline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
          Measuring civilizational stress in the age of AI
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>
          thehumanindex.org
        </div>
      </div>
    </div>
  )
}

function DomainCard({ data, theme, orientation = 'horizontal' }: { data: DomainCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)
  const color = getScoreColor(data.score, theme)
  const band = getScoreBand(data.score)

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: 48,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15, transparent 70%)`,
      }} />

      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2 }}>DOMAIN REPORT</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, marginTop: 4 }}>{data.date}</div>
        </div>
      </div>

      {/* Middle */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, position: 'relative' }}>
        <div style={{ fontSize: 11, color, fontFamily: theme.fontMono, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600 }}>
          {DOMAIN_LABELS[data.domain]}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 80, fontWeight: 800, color, fontFamily: theme.fontMono, lineHeight: 1 }}>
            {data.score}
          </div>
          <div>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px', borderRadius: 8,
              background: `${color}20`,
              border: `1px solid ${color}40`,
              fontSize: 14, fontWeight: 700, color, fontFamily: theme.fontMono, letterSpacing: 2,
            }}>
              {band}
            </div>
            {data.delta !== null && (
              <div style={{
                fontSize: 16, fontWeight: 600,
                fontFamily: theme.fontMono,
                color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
                marginTop: 8,
              }}>
                {data.delta > 0 ? '▲' : '▼'} {Math.abs(data.delta).toFixed(1)} from last week
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 18, color: theme.textSecondary, lineHeight: 1.6, maxWidth: 700 }}>
          {data.headline}
        </div>

        {/* Score bar */}
        <div style={{ maxWidth: 600 }}>
          <div style={{ height: 10, background: `${theme.textMuted}25`, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${data.score}%`, height: '100%', background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: theme.textMuted, fontFamily: theme.fontMono }}>
            <span>0 — LOW</span>
            <span>100 — CRITICAL</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
          Measuring civilizational stress in the age of AI
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>thehumanindex.org</div>
      </div>
    </div>
  )
}

function PulseCard({ data, theme, orientation = 'horizontal' }: { data: PulseCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)
  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: 48,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle line decoration */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: theme.accent }} />

      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 6,
            background: `${theme.accent}20`,
            fontSize: 11, fontWeight: 700, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 2,
          }}>
            WEEKLY PULSE
          </div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono }}>{data.date}</div>
        </div>
      </div>

      {/* Middle */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, position: 'relative' }}>
        <h2 style={{
          fontSize: 38, fontWeight: 700, color: theme.text,
          fontFamily: theme.fontHeading, lineHeight: 1.2, margin: 0,
          maxWidth: data.compositeScore ? 800 : 1000,
        }}>
          {data.title}
        </h2>

        <p style={{ fontSize: 17, color: theme.textSecondary, lineHeight: 1.7, margin: 0, maxWidth: 800 }}>
          {data.excerpt}
        </p>
      </div>

      {/* Score + bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>Read the full analysis at thehumanindex.org/pulse</div>
        {data.compositeScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>INDEX:</span>
            <span style={{
              fontSize: 22, fontWeight: 800,
              color: getScoreColor(data.compositeScore, theme),
              fontFamily: theme.fontMono,
            }}>
              {data.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function QuizCard({ data, theme, orientation = 'horizontal' }: { data: QuizCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)
  const bandColor = data.band === 'critical' ? theme.scoreColors.critical
    : data.band === 'high' ? theme.scoreColors.high
    : data.band === 'elevated' ? theme.scoreColors.elevated
    : data.band === 'moderate' ? theme.scoreColors.moderate
    : theme.scoreColors.low

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: 48,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', bottom: -100, left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${bandColor}12, transparent 70%)`,
      }} />

      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} />
        <div style={{
          padding: '6px 14px', borderRadius: 6,
          background: `${theme.accent}20`,
          fontSize: 11, fontWeight: 700, color: theme.accent, fontFamily: theme.fontMono, letterSpacing: 2,
        }}>
          AI EXPOSURE QUIZ
        </div>
      </div>

      {/* Middle */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 48, position: 'relative' }}>
        {/* Left: percentile + band */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `${bandColor}15`,
            border: `3px solid ${bandColor}40`,
            boxShadow: `0 0 60px ${bandColor}15`,
          }}>
            <div style={{ fontSize: 14, color: theme.textMuted, fontFamily: theme.fontMono, marginBottom: 4 }}>PERCENTILE</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: bandColor, fontFamily: theme.fontMono, lineHeight: 1 }}>
              {data.percentile}
            </div>
          </div>
          <div style={{
            padding: '6px 18px', borderRadius: 8,
            background: `${bandColor}20`, border: `1px solid ${bandColor}40`,
            fontSize: 14, fontWeight: 700, color: bandColor, fontFamily: theme.fontMono, letterSpacing: 2,
          }}>
            {data.band.toUpperCase()}
          </div>
        </div>

        {/* Right: job + risks */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 8 }}>MY ROLE</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeading, marginBottom: 24, lineHeight: 1.2 }}>
            {data.jobTitle}
          </div>

          {data.topRisks.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 10 }}>TOP TASKS AT RISK</div>
              {data.topRisks.slice(0, 3).map((risk, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: i < data.topRisks.length - 1 ? `1px solid ${theme.textMuted}20` : 'none',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${bandColor}20`,
                    fontSize: 10, fontWeight: 700, color: bandColor, fontFamily: theme.fontMono,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 15, color: theme.textSecondary }}>{risk}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
          Take the quiz at thehumanindex.org/quiz
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>thehumanindex.org</div>
      </div>
    </div>
  )
}

function TrendCard({ data, theme, orientation = 'horizontal' }: { data: TrendCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)
  const sortedDomains = [...data.domains].sort((a, b) => b.score - a.score)

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: orientation === 'horizontal' ? 48 : 56,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(${theme.text} 1px, transparent 1px), linear-gradient(90deg, ${theme.text} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Top: branding + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} size={orientation === 'horizontal' ? 'normal' : 'normal'} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2 }}>DOMAIN TRENDS</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, marginTop: 4 }}>{data.date}</div>
        </div>
      </div>

      {/* Middle: title + domain bars */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, position: 'relative', marginTop: orientation === 'horizontal' ? 0 : 20 }}>
        <h2 style={{
          fontSize: orientation === 'horizontal' ? 32 : 42,
          fontWeight: 700, color: theme.text,
          fontFamily: theme.fontHeading, lineHeight: 1.2, margin: 0,
        }}>
          {data.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {sortedDomains.map(d => {
            const color = getScoreColor(d.score, theme)
            return (
              <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, fontSize: 11, color: theme.textSecondary, fontFamily: theme.fontMono, fontWeight: 600, flexShrink: 0 }}>
                  {DOMAIN_LABELS[d.domain].split(' ').slice(0, 2).join(' ')}
                </div>
                <div style={{ flex: 1, height: 12, background: `${theme.textMuted}30`, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${d.score}%`, height: '100%', background: color, borderRadius: 6 }} />
                </div>
                <div style={{ width: 50, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: theme.fontMono }}>
                    {d.score}
                  </div>
                  <div style={{ fontSize: 10, color: d.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low, fontFamily: theme.fontMono }}>
                    {d.delta > 0 ? '▲' : '▼'} {Math.abs(d.delta).toFixed(1)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom: composite score + tagline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', marginTop: orientation === 'horizontal' ? 0 : 24 }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
          Measuring civilizational stress in the age of AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>COMPOSITE:</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: getScoreColor(data.compositeScore, theme), fontFamily: theme.fontMono }}>
            {data.compositeScore.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  )
}

function OverviewCard({ data, theme, orientation = 'horizontal' }: { data: OverviewCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)
  const sortedDomains = [...data.topDomains].sort((a, b) => b.score - a.score)

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: orientation === 'horizontal' ? 48 : 56,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -150, right: -150,
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${getScoreColor(data.compositeScore, theme)}12, transparent 70%)`,
      }} />

      {/* Top: branding */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} size={orientation === 'horizontal' ? 'normal' : 'normal'} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2 }}>WEEKLY OVERVIEW</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, marginTop: 4 }}>{data.date}</div>
        </div>
      </div>

      {/* Middle: hero score + domains + band */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32, position: 'relative' }}>
        {/* Hero score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <ScoreBadge score={data.compositeScore} theme={theme} size={orientation === 'horizontal' ? 'large' : 'large'} />
          {data.compositeChange !== null && (
            <div style={{
              fontSize: 18, fontWeight: 600,
              fontFamily: theme.fontMono,
              color: data.compositeChange > 0 ? theme.scoreColors.high : theme.scoreColors.low,
            }}>
              {data.compositeChange > 0 ? '▲' : '▼'} {Math.abs(data.compositeChange).toFixed(1)} pts from last week
            </div>
          )}
        </div>

        {/* Domain bars */}
        <div>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 16 }}>
            TOP DOMAIN READINGS
          </div>
          {sortedDomains.slice(0, 3).map(d => (
            <DomainBar key={d.domain} domain={d.domain} score={d.score} theme={theme} />
          ))}
        </div>

        {/* Band badge */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px', borderRadius: 8,
            background: `${getScoreColor(data.compositeScore, theme)}20`,
            border: `1px solid ${getScoreColor(data.compositeScore, theme)}40`,
            fontSize: 14, fontWeight: 700, color: getScoreColor(data.compositeScore, theme), fontFamily: theme.fontMono, letterSpacing: 2,
          }}>
            {data.band.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Bottom: tagline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
          Week {data.weekNumber} • Measuring civilizational stress in the age of AI
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>thehumanindex.org</div>
      </div>
    </div>
  )
}

function LayoffCard({ data, theme, orientation = 'horizontal' }: { data: LayoffCardData; theme: CardTheme; orientation?: CardOrientation }) {
  const { width: CARD_W, height: CARD_H } = getCardDimensions(orientation)

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: theme.bgGradient,
      display: 'flex', flexDirection: 'column',
      padding: orientation === 'horizontal' ? 48 : 56,
      fontFamily: theme.fontBody,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent glow - red tint */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.scoreColors.critical}15, transparent 70%)`,
      }} />

      {/* Top: branding */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Branding theme={theme} size={orientation === 'horizontal' ? 'normal' : 'normal'} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2 }}>LAYOFF TRACKER</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontMono, marginTop: 4 }}>{data.date}</div>
        </div>
      </div>

      {/* Middle */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, position: 'relative' }}>
        {/* Big number */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 8 }}>AFFECTED WORKERS</div>
          <div style={{
            fontSize: orientation === 'horizontal' ? 64 : 72,
            fontWeight: 800, color: theme.scoreColors.critical,
            fontFamily: theme.fontMono, lineHeight: 1,
          }}>
            {data.totalAffected}
          </div>
        </div>

        {/* Top companies */}
        <div>
          <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 16 }}>
            TOP COMPANIES
          </div>
          {data.topCompanies.slice(0, orientation === 'horizontal' ? 3 : 4).map((company, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '12px 0',
              borderBottom: i < (orientation === 'horizontal' ? Math.min(3, data.topCompanies.length) : Math.min(4, data.topCompanies.length)) - 1 ? `1px solid ${theme.textMuted}20` : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>
                  {company.name}
                </div>
                <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                  {company.reason}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.scoreColors.critical, fontFamily: theme.fontMono, flexShrink: 0 }}>
                {company.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
          Tracking workforce changes in tech
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono }}>thehumanindex.org</div>
      </div>
    </div>
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
