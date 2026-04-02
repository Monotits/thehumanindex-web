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
const F = 'Helvetica, Arial, sans-serif'
const FM = '"Courier New", Courier, monospace'
const FH = 'Georgia, "Times New Roman", serif'

// Short labels that fit everywhere
const SHORT: Record<Domain, string> = {
  work_risk: 'AI Work',
  inequality: 'Inequality',
  unrest: 'Unrest',
  decay: 'Inst. Decay',
  wellbeing: 'Wellbeing',
  policy: 'Policy',
  sentiment: 'Sentiment',
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 3).trim() + '...'
}

// ── Shared sub-components ───────────────────────────────

function Logo({ color, size = 16 }: { color: string; size?: number }) {
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

/** Domain bar with label ABOVE the bar — no horizontal clipping */
function DBar({ domain, score, theme, big }: {
  domain: Domain; score: number; theme: CardTheme; big?: boolean
}) {
  const color = getScoreColor(score, theme)
  const h = big ? 24 : 12
  const fs = big ? 28 : 12
  return (
    <div style={{ marginBottom: big ? 28 : 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: big ? 8 : 4 }}>
        <span style={{ fontSize: fs, color: theme.textSecondary, fontFamily: F }}>
          {DOMAIN_LABELS[domain]}
        </span>
        <span style={{ fontSize: fs + 2, fontWeight: 700, color, fontFamily: FM }}>
          {score}
        </span>
      </div>
      <div style={{ width: '100%', height: h, background: `${theme.textMuted}25`, borderRadius: h / 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: h / 2 }} />
      </div>
    </div>
  )
}

// ── Card Templates ───────────────────────────────

// Shared outer wrapper
function Wrap({ theme, orientation: o, children }: {
  theme: CardTheme; orientation: CardOrientation; children: React.ReactNode
}) {
  const isV = o === 'vertical'
  const w = isV ? 1080 : 1200
  const h = isV ? 1920 : 630
  return (
    <div style={{
      width: w, height: h,
      background: theme.bgGradient,
      padding: isV ? '72px 80px' : '44px 52px',
      fontFamily: F,
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${theme.text} 1px, transparent 1px), linear-gradient(90deg, ${theme.text} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {children}
    </div>
  )
}

function Header({ theme, label, date, isV }: { theme: CardTheme; label: string; date: string; isV?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0, marginBottom: isV ? 40 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 16 : 8 }}>
        <Logo color={theme.accent} size={isV ? 26 : 16} />
        <div>
          <div style={{ fontSize: isV ? 30 : 15, fontWeight: 700, color: theme.text, fontFamily: F, letterSpacing: 2 }}>
            THE HUMAN INDEX
          </div>
          <div style={{ fontSize: isV ? 18 : 9, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginTop: 2 }}>
            thehumanindex.org
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: isV ? 20 : 10, color: theme.textMuted, fontFamily: FM, letterSpacing: 2 }}>{label}</div>
        <div style={{ fontSize: isV ? 24 : 13, color: theme.textSecondary, fontFamily: FM, marginTop: 4 }}>{date}</div>
      </div>
    </div>
  )
}

function Footer({ theme, text, isV }: { theme: CardTheme; text: string; isV?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', flexShrink: 0, marginTop: isV ? 40 : 0 }}>
      <div style={{ fontSize: isV ? 22 : 13, color: theme.textMuted, fontStyle: 'italic', fontFamily: F }}>{text}</div>
      <div style={{ fontSize: isV ? 20 : 11, color: theme.textMuted, fontFamily: FM }}>thehumanindex.org</div>
    </div>
  )
}

// ── COMPOSITE ────────────────────────────

function CompositeCard({ data, theme, orientation: o }: { data: CompositeCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'
  const sorted = [...data.domains].sort((a, b) => b.score - a.score)
  const sc = getScoreColor(data.score, theme)
  const band = getScoreBand(data.score)
  const badgeSize = isV ? 260 : 130

  return (
    <Wrap theme={theme} orientation={o}>
      <Header theme={theme} label="COMPOSITE INDEX" date={data.date} isV={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: isV ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isV ? 48 : 48, position: 'relative' }}>
        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{
            width: badgeSize, height: badgeSize, borderRadius: badgeSize,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `${sc}15`, border: `3px solid ${sc}40`,
          }}>
            <div style={{ fontSize: badgeSize * 0.36, fontWeight: 800, color: sc, fontFamily: FM, lineHeight: 1 }}>
              {data.score.toFixed(1)}
            </div>
            <div style={{ fontSize: badgeSize * 0.1, fontWeight: 700, color: sc, fontFamily: FM, letterSpacing: 2, marginTop: 6 }}>
              {band}
            </div>
          </div>
          {data.delta !== null && (
            <div style={{
              fontSize: isV ? 28 : 15, fontWeight: 700, fontFamily: FM,
              color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
            }}>
              {data.delta > 0 ? '+' : ''}{data.delta.toFixed(1)} pts
            </div>
          )}
        </div>

        {/* Domain bars */}
        <div style={{ width: isV ? '100%' : undefined, flex: isV ? undefined : 1, maxWidth: isV ? 800 : undefined }}>
          <div style={{ fontSize: isV ? 22 : 10, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginBottom: isV ? 20 : 12 }}>
            DOMAIN READINGS
          </div>
          {sorted.map(d => (
            <DBar key={d.domain} domain={d.domain} score={d.score} theme={theme} big={isV} />
          ))}
        </div>
      </div>

      <Footer theme={theme} text="Measuring civilizational stress in the age of AI" isV={isV} />
    </Wrap>
  )
}

// ── DOMAIN ────────────────────────────

function DomainCard({ data, theme, orientation: o }: { data: DomainCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'
  const color = getScoreColor(data.score, theme)
  const band = getScoreBand(data.score)

  return (
    <Wrap theme={theme} orientation={o}>
      <div style={{
        position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15, transparent 70%)`, pointerEvents: 'none',
      }} />
      <Header theme={theme} label="DOMAIN REPORT" date={data.date} isV={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 48 : 20, position: 'relative' }}>
        <div style={{ fontSize: isV ? 28 : 13, color, fontFamily: FM, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
          {DOMAIN_LABELS[data.domain]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 36 : 28 }}>
          <div style={{ fontSize: isV ? 140 : 80, fontWeight: 800, color, fontFamily: FM, lineHeight: 1 }}>
            {data.score}
          </div>
          <div>
            <div style={{
              display: 'inline-block', padding: isV ? '14px 28px' : '6px 14px', borderRadius: 8,
              background: `${color}20`, border: `1px solid ${color}40`,
              fontSize: isV ? 28 : 14, fontWeight: 700, color, fontFamily: FM, letterSpacing: 2,
            }}>
              {band}
            </div>
            {data.delta !== null && (
              <div style={{
                fontSize: isV ? 28 : 16, fontWeight: 700, fontFamily: FM,
                color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
                marginTop: 14,
              }}>
                {data.delta > 0 ? '+' : ''}{data.delta.toFixed(1)} from last week
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: isV ? 32 : 18, color: theme.textSecondary, lineHeight: 1.6, fontFamily: F }}>
          {truncate(data.headline, isV ? 200 : 140)}
        </div>
        <div style={{ maxWidth: isV ? 900 : 600 }}>
          <div style={{ height: isV ? 20 : 10, background: `${theme.textMuted}25`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${data.score}%`, height: '100%', background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 8 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: isV ? 20 : 9, color: theme.textMuted, fontFamily: FM }}>
            <span>0 - LOW</span>
            <span>100 - CRITICAL</span>
          </div>
        </div>
      </div>

      <Footer theme={theme} text="Measuring civilizational stress in the age of AI" isV={isV} />
    </Wrap>
  )
}

// ── PULSE ────────────────────────────

function PulseCard({ data, theme, orientation: o }: { data: PulseCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'

  return (
    <Wrap theme={theme} orientation={o}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: theme.accent, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0, marginBottom: isV ? 40 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 16 : 8 }}>
          <Logo color={theme.accent} size={isV ? 26 : 16} />
          <div>
            <div style={{ fontSize: isV ? 30 : 15, fontWeight: 700, color: theme.text, fontFamily: F, letterSpacing: 2 }}>THE HUMAN INDEX</div>
            <div style={{ fontSize: isV ? 18 : 9, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginTop: 2 }}>thehumanindex.org</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            padding: isV ? '10px 22px' : '6px 14px', borderRadius: 6,
            background: `${theme.accent}20`,
            fontSize: isV ? 22 : 11, fontWeight: 700, color: theme.accent, fontFamily: FM, letterSpacing: 2,
          }}>
            WEEKLY PULSE
          </div>
          <div style={{ fontSize: isV ? 22 : 13, color: theme.textSecondary, fontFamily: FM }}>{data.date}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 48 : 24, position: 'relative' }}>
        <h2 style={{
          fontSize: isV ? 64 : 36, fontWeight: 700, color: theme.text,
          fontFamily: FH, lineHeight: 1.25, margin: 0,
        }}>
          {truncate(data.title, isV ? 100 : 70)}
        </h2>
        <p style={{ fontSize: isV ? 34 : 17, color: theme.textSecondary, lineHeight: 1.7, margin: 0, fontFamily: F }}>
          {truncate(data.excerpt, isV ? 400 : 200)}
        </p>
        {isV && data.compositeScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <span style={{ fontSize: 26, color: theme.textMuted, fontFamily: FM }}>INDEX SCORE:</span>
            <span style={{ fontSize: 56, fontWeight: 800, color: getScoreColor(data.compositeScore, theme), fontFamily: FM }}>
              {data.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', flexShrink: 0, marginTop: isV ? 40 : 0 }}>
        <div style={{ fontSize: isV ? 22 : 13, color: theme.textMuted, fontStyle: 'italic', fontFamily: F }}>
          Read the full analysis at thehumanindex.org/pulse
        </div>
        {!isV && data.compositeScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: FM }}>INDEX:</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: getScoreColor(data.compositeScore, theme), fontFamily: FM }}>
              {data.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Wrap>
  )
}

// ── QUIZ ────────────────────────────

function QuizCard({ data, theme, orientation: o }: { data: QuizCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'
  const bc = data.band === 'critical' ? theme.scoreColors.critical
    : data.band === 'high' ? theme.scoreColors.high
    : data.band === 'elevated' ? theme.scoreColors.elevated
    : data.band === 'moderate' ? theme.scoreColors.moderate
    : theme.scoreColors.low
  const cs = isV ? 240 : 160

  return (
    <Wrap theme={theme} orientation={o}>
      <div style={{
        position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${bc}12, transparent 70%)`, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0, marginBottom: isV ? 40 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 16 : 8 }}>
          <Logo color={theme.accent} size={isV ? 26 : 16} />
          <div>
            <div style={{ fontSize: isV ? 30 : 15, fontWeight: 700, color: theme.text, fontFamily: F, letterSpacing: 2 }}>THE HUMAN INDEX</div>
            <div style={{ fontSize: isV ? 18 : 9, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginTop: 2 }}>thehumanindex.org</div>
          </div>
        </div>
        <div style={{
          padding: isV ? '10px 22px' : '6px 14px', borderRadius: 6,
          background: `${theme.accent}20`,
          fontSize: isV ? 22 : 11, fontWeight: 700, color: theme.accent, fontFamily: FM, letterSpacing: 2,
        }}>
          AI EXPOSURE QUIZ
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: isV ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isV ? 56 : 48, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{
            width: cs, height: cs, borderRadius: cs,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `${bc}15`, border: `3px solid ${bc}40`,
          }}>
            <div style={{ fontSize: isV ? 26 : 14, color: theme.textMuted, fontFamily: FM, marginBottom: 6 }}>PERCENTILE</div>
            <div style={{ fontSize: isV ? 88 : 52, fontWeight: 800, color: bc, fontFamily: FM, lineHeight: 1 }}>{data.percentile}</div>
          </div>
          <div style={{
            padding: isV ? '12px 28px' : '6px 18px', borderRadius: 8,
            background: `${bc}20`, border: `1px solid ${bc}40`,
            fontSize: isV ? 26 : 14, fontWeight: 700, color: bc, fontFamily: FM, letterSpacing: 2,
          }}>
            {data.band.toUpperCase()}
          </div>
        </div>

        <div style={{ textAlign: isV ? 'center' : 'left', width: isV ? '100%' : undefined, flex: isV ? undefined : 1 }}>
          <div style={{ fontSize: isV ? 24 : 14, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginBottom: 8 }}>MY ROLE</div>
          <div style={{ fontSize: isV ? 52 : 28, fontWeight: 700, color: theme.text, fontFamily: FH, marginBottom: isV ? 40 : 24, lineHeight: 1.2 }}>
            {truncate(data.jobTitle, 35)}
          </div>
          {data.topRisks.length > 0 && (
            <div style={{ textAlign: 'left', maxWidth: isV ? 700 : undefined, margin: isV ? '0 auto' : undefined }}>
              <div style={{ fontSize: isV ? 22 : 11, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginBottom: 12 }}>TOP TASKS AT RISK</div>
              {data.topRisks.slice(0, 3).map((risk, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: isV ? '18px 0' : '10px 0',
                  borderBottom: i < 2 ? `1px solid ${theme.textMuted}20` : 'none',
                }}>
                  <div style={{
                    width: isV ? 40 : 24, height: isV ? 40 : 24, borderRadius: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${bc}20`, fontSize: isV ? 20 : 12, fontWeight: 700, color: bc, fontFamily: FM, flexShrink: 0,
                  }}>{i + 1}</div>
                  <span style={{ fontSize: isV ? 28 : 15, color: theme.textSecondary, fontFamily: F }}>{truncate(risk, 45)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer theme={theme} text="Take the quiz at thehumanindex.org/quiz" isV={isV} />
    </Wrap>
  )
}

// ── TREND ────────────────────────────

function TrendCard({ data, theme, orientation: o }: { data: TrendCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'
  const sorted = [...data.domains].sort((a, b) => b.score - a.score)

  return (
    <Wrap theme={theme} orientation={o}>
      <Header theme={theme} label="DOMAIN TRENDS" date={data.date} isV={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 40 : 16, position: 'relative' }}>
        <h2 style={{ fontSize: isV ? 56 : 30, fontWeight: 700, color: theme.text, fontFamily: FH, lineHeight: 1.2, margin: 0 }}>
          {data.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isV ? 6 : 2 }}>
          {sorted.map(d => {
            const color = getScoreColor(d.score, theme)
            const dc = d.delta > 0 ? theme.scoreColors.high : d.delta < 0 ? theme.scoreColors.low : theme.textMuted
            const barH = isV ? 24 : 14
            return (
              <div key={d.domain} style={{ marginBottom: isV ? 20 : 6 }}>
                {/* Label row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: isV ? 8 : 3 }}>
                  <span style={{ fontSize: isV ? 28 : 12, color: theme.textSecondary, fontFamily: F }}>
                    {SHORT[d.domain]}
                  </span>
                  <div style={{ display: 'flex', gap: isV ? 24 : 12, alignItems: 'baseline' }}>
                    <span style={{ fontSize: isV ? 28 : 14, fontWeight: 700, color, fontFamily: FM }}>{d.score}</span>
                    <span style={{ fontSize: isV ? 24 : 11, fontWeight: 600, color: dc, fontFamily: FM }}>
                      {d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)}
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div style={{ width: '100%', height: barH, background: `${theme.textMuted}25`, borderRadius: barH / 2, overflow: 'hidden' }}>
                  <div style={{ width: `${d.score}%`, height: '100%', background: color, borderRadius: barH / 2 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', flexShrink: 0, marginTop: isV ? 40 : 0 }}>
        <div style={{ fontSize: isV ? 22 : 13, color: theme.textMuted, fontStyle: 'italic', fontFamily: F }}>
          Measuring civilizational stress in the age of AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: isV ? 22 : 11, color: theme.textMuted, fontFamily: FM }}>COMPOSITE:</span>
          <span style={{ fontSize: isV ? 40 : 20, fontWeight: 800, color: getScoreColor(data.compositeScore, theme), fontFamily: FM }}>
            {data.compositeScore.toFixed(1)}
          </span>
        </div>
      </div>
    </Wrap>
  )
}

// ── OVERVIEW ────────────────────────────

function OverviewCard({ data, theme, orientation: o }: { data: OverviewCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'
  const sorted = [...data.topDomains].sort((a, b) => b.score - a.score)
  const sc = getScoreColor(data.compositeScore, theme)
  const badgeSize = isV ? 280 : 130

  return (
    <Wrap theme={theme} orientation={o}>
      <div style={{
        position: 'absolute', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${sc}12, transparent 70%)`, pointerEvents: 'none',
      }} />
      <Header theme={theme} label="WEEKLY OVERVIEW" date={data.date} isV={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isV ? 44 : 20, position: 'relative' }}>
        <div style={{
          width: badgeSize, height: badgeSize, borderRadius: badgeSize,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `${sc}15`, border: `3px solid ${sc}40`,
        }}>
          <div style={{ fontSize: badgeSize * 0.35, fontWeight: 800, color: sc, fontFamily: FM, lineHeight: 1 }}>
            {data.compositeScore.toFixed(1)}
          </div>
          <div style={{ fontSize: badgeSize * 0.1, fontWeight: 700, color: sc, fontFamily: FM, letterSpacing: 2, marginTop: 6 }}>
            {getScoreBand(data.compositeScore)}
          </div>
        </div>

        {data.compositeChange !== null && (
          <div style={{
            fontSize: isV ? 30 : 16, fontWeight: 700, fontFamily: FM,
            color: data.compositeChange > 0 ? theme.scoreColors.high : theme.scoreColors.low,
          }}>
            {data.compositeChange > 0 ? '+' : ''}{data.compositeChange.toFixed(1)} pts from last week
          </div>
        )}

        <div style={{ width: '100%', maxWidth: isV ? 800 : 500 }}>
          <div style={{ fontSize: isV ? 22 : 10, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginBottom: isV ? 20 : 10, textAlign: 'center' }}>
            TOP DOMAIN READINGS
          </div>
          {sorted.slice(0, isV ? 5 : 3).map(d => (
            <DBar key={d.domain} domain={d.domain} score={d.score} theme={theme} big={isV} />
          ))}
        </div>

        <div style={{
          padding: isV ? '14px 32px' : '8px 20px', borderRadius: 8,
          background: `${sc}20`, border: `1px solid ${sc}40`,
          fontSize: isV ? 28 : 14, fontWeight: 700, color: sc, fontFamily: FM, letterSpacing: 2,
        }}>
          {data.band.toUpperCase()}
        </div>
      </div>

      <Footer theme={theme} text={`Week ${data.weekNumber} • Measuring civilizational stress in the age of AI`} isV={isV} />
    </Wrap>
  )
}

// ── LAYOFF ────────────────────────────

function LayoffCard({ data, theme, orientation: o }: { data: LayoffCardData; theme: CardTheme; orientation: CardOrientation }) {
  const isV = o === 'vertical'
  const crit = theme.scoreColors.critical

  return (
    <Wrap theme={theme} orientation={o}>
      <div style={{
        position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${crit}15, transparent 70%)`, pointerEvents: 'none',
      }} />
      <Header theme={theme} label="LAYOFF TRACKER" date={data.date} isV={isV} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isV ? 64 : 28, position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: isV ? 28 : 14, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginBottom: isV ? 16 : 10 }}>AFFECTED WORKERS</div>
          <div style={{ fontSize: isV ? 120 : 64, fontWeight: 800, color: crit, fontFamily: FM, lineHeight: 1 }}>
            {data.totalAffected}
          </div>
        </div>

        <div style={{ maxWidth: isV ? 800 : undefined, margin: isV ? '0 auto' : undefined, width: isV ? '100%' : undefined }}>
          <div style={{ fontSize: isV ? 22 : 11, color: theme.textMuted, fontFamily: FM, letterSpacing: 2, marginBottom: isV ? 20 : 14 }}>
            TOP COMPANIES
          </div>
          {data.topCompanies.slice(0, isV ? 5 : 3).map((c, i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: isV ? '22px 0' : '12px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${theme.textMuted}20` : 'none',
            }}>
              <div>
                <div style={{ fontSize: isV ? 30 : 14, fontWeight: 700, color: theme.text, fontFamily: F }}>{c.name}</div>
                <div style={{ fontSize: isV ? 24 : 12, color: theme.textSecondary, marginTop: 6, fontFamily: F }}>{c.reason}</div>
              </div>
              <div style={{ fontSize: isV ? 28 : 13, fontWeight: 700, color: crit, fontFamily: FM, flexShrink: 0, paddingLeft: 20 }}>
                {c.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer theme={theme} text="Tracking workforce changes in tech" isV={isV} />
    </Wrap>
  )
}

// ── Main Renderer ───────────────────────────────

export function ShareCardRenderer({ data, theme, orientation = 'horizontal' }: { data: ShareCardData; theme: CardTheme; orientation?: CardOrientation }) {
  switch (data.type) {
    case 'composite': return <CompositeCard data={data} theme={theme} orientation={orientation} />
    case 'domain': return <DomainCard data={data} theme={theme} orientation={orientation} />
    case 'pulse': return <PulseCard data={data} theme={theme} orientation={orientation} />
    case 'quiz': return <QuizCard data={data} theme={theme} orientation={orientation} />
    case 'trend': return <TrendCard data={data} theme={theme} orientation={orientation} />
    case 'overview': return <OverviewCard data={data} theme={theme} orientation={orientation} />
    case 'layoff': return <LayoffCard data={data} theme={theme} orientation={orientation} />
  }
}
