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

export interface DashboardCardData {
  type: 'dashboard'
  compositeScore: number
  band: string
  delta: number | null
  activeDomains: number
  totalDomains: number
  domains: { domain: Domain; score: number }[]
  connectedSources: string[]
  totalSources: number
  indicatorCount: number
  trend: { label: string; score: number }[] // last N months
  topInsight: string | null // correlation insight text
  date: string
}

export type ShareCardData = CompositeCardData | DomainCardData | PulseCardData | QuizCardData | TrendCardData | OverviewCardData | LayoffCardData | DashboardCardData

// ── SAFE FONTS for html2canvas (no custom web fonts) ────────
// Space Grotesk → Helvetica fallback for headlines
// Inter → Arial fallback for body
// Courier New for mono/data
const FH = 'Helvetica, Arial, sans-serif'
const FB = 'Arial, Helvetica, sans-serif'
const FM = '"Courier New", Courier, monospace'

const SHORT: Record<Domain, string> = {
  work_risk: 'AI WORK RISK',
  inequality: 'INEQUALITY',
  unrest: 'SOCIAL UNREST',
  decay: 'INST. DECAY',
  wellbeing: 'WELLBEING',
  policy: 'POLICY',
  sentiment: 'SENTIMENT',
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 3).trim() + '...'
}

// ── Brand Logo ───────────────────────────────
// Shield icon matching the screenshots

function BrandLogo({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 24 29" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M12 2L3 6v7c0 6.075 3.84 11.44 9 13 5.16-1.56 9-6.925 9-13V6L12 2z"
        stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="13" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <line x1="12" y1="10" x2="12" y2="6" stroke={color} strokeWidth="1" />
      <line x1="12" y1="16" x2="12" y2="20" stroke={color} strokeWidth="1" />
      <line x1="9" y1="13" x2="6" y2="13" stroke={color} strokeWidth="1" />
      <line x1="15" y1="13" x2="18" y2="13" stroke={color} strokeWidth="1" />
    </svg>
  )
}

// ── Ambient Glow (radial gradient overlay) ──────────────
function AmbientGlow({ color, x, y, size = 500, opacity = 0.12 }: {
  color: string; x: string; y: string; size?: number; opacity?: number
}) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, transparent 70%)`,
      pointerEvents: 'none',
    }} />
  )
}

// ── Noise Texture Overlay (digital grain) ──────────────
function NoiseOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundSize: '128px 128px',
    }} />
  )
}

// ── Shared outer wrapper ───────────────────────────────

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
      padding: isV ? '80px 72px' : '40px 48px',
      fontFamily: FB,
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Subtle scan lines for cinematic depth */}
      {theme.isDark && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${theme.text}08 2px, ${theme.text}08 4px)`,
        }} />
      )}
      <NoiseOverlay />
      {children}
    </div>
  )
}

// ── Header bar ───────────────────────────────

function Header({ theme, label, date, isV }: { theme: CardTheme; label: string; date?: string; isV?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      position: 'relative', flexShrink: 0, marginBottom: isV ? 48 : 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 16 : 10 }}>
        <BrandLogo color={theme.accent} size={isV ? 28 : 18} />
        <div>
          <div style={{
            fontSize: isV ? 28 : 14, fontWeight: 700, color: theme.text,
            fontFamily: FH, letterSpacing: 3, textTransform: 'uppercase',
          }}>
            THE HUMAN INDEX
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 20 : 12 }}>
        <div style={{
          padding: isV ? '8px 20px' : '4px 12px',
          background: `${theme.accent}15`,
          fontSize: isV ? 18 : 9, fontWeight: 700, color: theme.accent,
          fontFamily: FM, letterSpacing: 3, textTransform: 'uppercase',
        }}>
          {label}
        </div>
        {date && (
          <div style={{ fontSize: isV ? 20 : 11, color: theme.textMuted, fontFamily: FM, letterSpacing: 1 }}>
            {date}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Footer ───────────────────────────────

function Footer({ theme, text, isV }: { theme: CardTheme; text?: string; isV?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      position: 'relative', flexShrink: 0, marginTop: isV ? 48 : 16,
    }}>
      {text && (
        <div style={{ fontSize: isV ? 20 : 11, color: theme.textMuted, fontFamily: FB, letterSpacing: 0.5 }}>
          {text}
        </div>
      )}
      <div style={{ fontSize: isV ? 18 : 10, color: theme.textMuted, fontFamily: FM, letterSpacing: 2 }}>
        thehumanindex.org
      </div>
    </div>
  )
}

// ── Domain Progress Bar (cinematic style) ──────────────

function DomainBar({ domain, score, theme, big }: {
  domain: Domain; score: number; theme: CardTheme; big?: boolean
}) {
  const color = getScoreColor(score, theme)
  const h = big ? 6 : 4
  const fs = big ? 22 : 11
  return (
    <div style={{ marginBottom: big ? 24 : 10 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: big ? 8 : 4,
      }}>
        <span style={{
          fontSize: fs, color: theme.textSecondary, fontFamily: FM,
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          {SHORT[domain]}
        </span>
        <span style={{
          fontSize: fs + 2, fontWeight: 700, color, fontFamily: FM,
        }}>
          {score}
        </span>
      </div>
      {/* Track */}
      <div style={{
        width: '100%', height: h,
        background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* Fill with glow */}
        <div style={{
          width: `${score}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}60, ${color})`,
          boxShadow: `0 0 12px ${color}40`,
        }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// CARD TEMPLATES
// ══════════════════════════════════════════════════════════

// ── COMPOSITE ────────────────────────────

function CompositeCard({ data, theme, orientation: o }: {
  data: CompositeCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const sorted = [...data.domains].sort((a, b) => b.score - a.score)
  const sc = getScoreColor(data.score, theme)
  const band = getScoreBand(data.score)

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={sc} x="75%" y="20%" size={isV ? 700 : 400} opacity={0.1} />
      <Header theme={theme} label="COMPOSITE INDEX" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex',
        flexDirection: isV ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: isV ? 56 : 52,
        position: 'relative',
      }}>
        {/* Score Display — asymmetric, cinematic */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: isV ? 20 : 10, flexShrink: 0,
        }}>
          {/* Label */}
          <div style={{
            fontSize: isV ? 18 : 9, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, textTransform: 'uppercase',
          }}>
            SECURITY PROTOCOL
          </div>
          {/* Big number */}
          <div style={{
            fontSize: isV ? 160 : 86, fontWeight: 800, color: sc,
            fontFamily: FH, lineHeight: 0.9, letterSpacing: -3,
            textShadow: theme.isDark ? `0 0 40px ${sc}30` : 'none',
          }}>
            {data.score.toFixed(1)}
          </div>
          {/* Band badge */}
          <div style={{
            padding: isV ? '10px 28px' : '5px 16px',
            background: `${sc}18`,
            fontSize: isV ? 22 : 11, fontWeight: 700, color: sc,
            fontFamily: FM, letterSpacing: 3,
          }}>
            {band}
          </div>
          {/* Delta */}
          {data.delta !== null && (
            <div style={{
              fontSize: isV ? 24 : 13, fontWeight: 600, fontFamily: FM,
              color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
            }}>
              {data.delta > 0 ? '\u25B2' : '\u25BC'} {Math.abs(data.delta).toFixed(1)} pts
            </div>
          )}
        </div>

        {/* Domain readings */}
        <div style={{
          width: isV ? '100%' : undefined, flex: isV ? undefined : 1,
          maxWidth: isV ? 800 : undefined,
        }}>
          <div style={{
            fontSize: isV ? 16 : 8, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, marginBottom: isV ? 24 : 14,
          }}>
            DOMAIN READINGS
          </div>
          {sorted.map(d => (
            <DomainBar key={d.domain} domain={d.domain} score={d.score} theme={theme} big={isV} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: 'relative', flexShrink: 0, marginTop: isV ? 32 : 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isV ? '20px 0' : '10px 0',
        borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div style={{
          fontSize: isV ? 22 : 11, color: theme.textSecondary, fontFamily: FB,
        }}>
          How exposed is your job? Take the AI risk quiz.
        </div>
        <div style={{
          padding: isV ? '10px 24px' : '5px 14px',
          background: `${theme.accentSecondary}18`,
          fontSize: isV ? 16 : 8, fontWeight: 700, color: theme.accentSecondary,
          fontFamily: FM, letterSpacing: 2, flexShrink: 0,
        }}>
          thehumanindex.org/quiz
        </div>
      </div>
      <Footer theme={theme} isV={isV} />
    </Wrap>
  )
}

// ── DOMAIN ────────────────────────────

function DomainCard({ data, theme, orientation: o }: {
  data: DomainCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const color = getScoreColor(data.score, theme)
  const band = getScoreBand(data.score)

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={color} x="80%" y="10%" size={500} opacity={0.12} />
      <Header theme={theme} label="DOMAIN REPORT" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: isV ? 40 : 16, position: 'relative',
      }}>
        {/* Domain label */}
        <div style={{
          fontSize: isV ? 20 : 10, color, fontFamily: FM,
          letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700,
        }}>
          {DOMAIN_LABELS[data.domain]}
        </div>
        {/* Score + Band */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: isV ? 28 : 16 }}>
          <div style={{
            fontSize: isV ? 140 : 72, fontWeight: 800, color,
            fontFamily: FH, lineHeight: 0.85, letterSpacing: -2,
            textShadow: theme.isDark ? `0 0 30px ${color}25` : 'none',
          }}>
            {data.score}
          </div>
          <div style={{ paddingBottom: isV ? 16 : 8 }}>
            <div style={{
              display: 'inline-block', padding: isV ? '10px 22px' : '4px 12px',
              background: `${color}18`,
              fontSize: isV ? 22 : 12, fontWeight: 700, color,
              fontFamily: FM, letterSpacing: 3,
            }}>
              {band}
            </div>
            {data.delta !== null && (
              <div style={{
                fontSize: isV ? 24 : 13, fontWeight: 600, fontFamily: FM,
                color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
                marginTop: isV ? 12 : 6,
              }}>
                {data.delta > 0 ? '\u25B2' : '\u25BC'} {Math.abs(data.delta).toFixed(1)} from last week
              </div>
            )}
          </div>
        </div>
        {/* Headline */}
        <div style={{
          fontSize: isV ? 30 : 16, color: theme.textSecondary,
          lineHeight: 1.5, fontFamily: FB, maxWidth: isV ? 900 : 600,
        }}>
          {truncate(data.headline, isV ? 200 : 140)}
        </div>
        {/* Bar */}
        <div style={{ maxWidth: isV ? 900 : 600 }}>
          <div style={{
            height: isV ? 6 : 4, overflow: 'hidden',
            background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: `${data.score}%`, height: '100%',
              background: `linear-gradient(90deg, ${color}60, ${color})`,
              boxShadow: `0 0 12px ${color}40`,
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontSize: isV ? 16 : 8, color: theme.textMuted, fontFamily: FM, letterSpacing: 2,
          }}>
            <span>0 LOW</span><span>100 CRITICAL</span>
          </div>
        </div>
      </div>

      <Footer theme={theme} text="Measuring civilizational stress in the age of AI" isV={isV} />
    </Wrap>
  )
}

// ── PULSE ────────────────────────────

function PulseCard({ data, theme, orientation: o }: {
  data: PulseCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'

  return (
    <Wrap theme={theme} orientation={o}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentSecondary})`,
        pointerEvents: 'none',
      }} />
      <AmbientGlow color={theme.accent} x="20%" y="60%" size={isV ? 600 : 350} opacity={0.08} />
      <Header theme={theme} label="WEEKLY PULSE" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: isV ? 40 : 20, position: 'relative',
      }}>
        <h2 style={{
          fontSize: isV ? 60 : 32, fontWeight: 700, color: theme.text,
          fontFamily: FH, lineHeight: 1.15, margin: 0, letterSpacing: -1,
        }}>
          {truncate(data.title, isV ? 100 : 70)}
        </h2>
        <p style={{
          fontSize: isV ? 30 : 15, color: theme.textSecondary,
          lineHeight: 1.6, margin: 0, fontFamily: FB, maxWidth: isV ? 900 : undefined,
        }}>
          {truncate(data.excerpt, isV ? 400 : 200)}
        </p>
        {data.compositeScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 16 : 10, marginTop: isV ? 16 : 8 }}>
            <span style={{
              fontSize: isV ? 18 : 9, color: theme.textMuted, fontFamily: FM, letterSpacing: 3,
            }}>
              INDEX SCORE
            </span>
            <span style={{
              fontSize: isV ? 48 : 24, fontWeight: 800,
              color: getScoreColor(data.compositeScore, theme),
              fontFamily: FH,
              textShadow: theme.isDark ? `0 0 20px ${getScoreColor(data.compositeScore, theme)}25` : 'none',
            }}>
              {data.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <Footer theme={theme} text="Read the full analysis at thehumanindex.org/pulse" isV={isV} />
    </Wrap>
  )
}

// ── QUIZ ────────────────────────────

function QuizCard({ data, theme, orientation: o }: {
  data: QuizCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const bc = data.band === 'critical' ? theme.scoreColors.critical
    : data.band === 'high' ? theme.scoreColors.high
    : data.band === 'elevated' ? theme.scoreColors.elevated
    : data.band === 'moderate' ? theme.scoreColors.moderate
    : theme.scoreColors.low

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={bc} x="50%" y="80%" size={isV ? 700 : 400} opacity={0.08} />
      <Header theme={theme} label="AI EXPOSURE QUIZ" isV={isV} />

      <div style={{
        flex: 1, display: 'flex',
        flexDirection: isV ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: isV ? 56 : 44, position: 'relative',
      }}>
        {/* Percentile display */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: isV ? 16 : 8, flexShrink: 0,
        }}>
          <div style={{
            fontSize: isV ? 16 : 8, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4,
          }}>
            JOB SECURITY
          </div>
          {/* Circular gauge — simplified as layered div */}
          <div style={{
            width: isV ? 220 : 130, height: isV ? 220 : 130,
            borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `${bc}10`,
            boxShadow: `0 0 0 2px ${bc}25, 0 0 40px ${bc}15`,
          }}>
            <div style={{
              fontSize: isV ? 80 : 46, fontWeight: 800, color: bc,
              fontFamily: FH, lineHeight: 1,
            }}>
              {data.percentile}
            </div>
            <div style={{
              fontSize: isV ? 18 : 10, color: theme.textMuted,
              fontFamily: FM, letterSpacing: 1, marginTop: 4,
            }}>
              PERCENTILE
            </div>
          </div>
          <div style={{
            padding: isV ? '8px 24px' : '4px 14px',
            background: `${bc}18`,
            fontSize: isV ? 20 : 11, fontWeight: 700, color: bc,
            fontFamily: FM, letterSpacing: 3,
          }}>
            {data.band.toUpperCase()}
          </div>
        </div>

        {/* Role + Risks */}
        <div style={{
          textAlign: isV ? 'center' : 'left',
          width: isV ? '100%' : undefined, flex: isV ? undefined : 1,
        }}>
          <div style={{
            fontSize: isV ? 18 : 10, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, marginBottom: isV ? 12 : 6,
          }}>
            MY ROLE
          </div>
          <div style={{
            fontSize: isV ? 48 : 26, fontWeight: 700, color: theme.text,
            fontFamily: FH, marginBottom: isV ? 40 : 20, lineHeight: 1.15, letterSpacing: -0.5,
          }}>
            {truncate(data.jobTitle, 35)}
          </div>
          {data.topRisks.length > 0 && (
            <div style={{
              textAlign: 'left',
              maxWidth: isV ? 700 : undefined,
              margin: isV ? '0 auto' : undefined,
            }}>
              <div style={{
                fontSize: isV ? 16 : 9, color: theme.textMuted, fontFamily: FM,
                letterSpacing: 4, marginBottom: isV ? 16 : 8,
              }}>
                TOP TASKS AT RISK
              </div>
              {data.topRisks.slice(0, 3).map((risk, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: isV ? 16 : 10,
                  padding: isV ? '16px 0' : '8px 0',
                  borderBottom: i < 2
                    ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                    : 'none',
                }}>
                  <div style={{
                    width: isV ? 32 : 20, height: isV ? 32 : 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${bc}18`,
                    fontSize: isV ? 16 : 10, fontWeight: 700, color: bc,
                    fontFamily: FM, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: isV ? 24 : 13, color: theme.textSecondary, fontFamily: FB,
                  }}>
                    {truncate(risk, 45)}
                  </span>
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

function TrendCard({ data, theme, orientation: o }: {
  data: TrendCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const sorted = [...data.domains].sort((a, b) => b.score - a.score)

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={theme.accent} x="15%" y="30%" size={isV ? 500 : 300} opacity={0.08} />
      <Header theme={theme} label="DOMAIN TRENDS" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: isV ? 36 : 14, position: 'relative',
      }}>
        <h2 style={{
          fontSize: isV ? 52 : 28, fontWeight: 700, color: theme.text,
          fontFamily: FH, lineHeight: 1.15, margin: 0, letterSpacing: -0.5,
        }}>
          {data.title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isV ? 4 : 1 }}>
          {sorted.map(d => {
            const color = getScoreColor(d.score, theme)
            const dc = d.delta > 0 ? theme.scoreColors.high : d.delta < 0 ? theme.scoreColors.low : theme.textMuted
            const barH = isV ? 6 : 3
            return (
              <div key={d.domain} style={{ marginBottom: isV ? 18 : 6 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: isV ? 6 : 2,
                }}>
                  <span style={{
                    fontSize: isV ? 20 : 10, color: theme.textSecondary,
                    fontFamily: FM, letterSpacing: 2,
                  }}>
                    {SHORT[d.domain]}
                  </span>
                  <div style={{ display: 'flex', gap: isV ? 20 : 10, alignItems: 'baseline' }}>
                    <span style={{ fontSize: isV ? 22 : 12, fontWeight: 700, color, fontFamily: FM }}>
                      {d.score}
                    </span>
                    <span style={{ fontSize: isV ? 18 : 10, fontWeight: 600, color: dc, fontFamily: FM }}>
                      {d.delta > 0 ? '\u25B2' : '\u25BC'}{Math.abs(d.delta).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '100%', height: barH, overflow: 'hidden',
                  background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    width: `${d.score}%`, height: '100%',
                    background: `linear-gradient(90deg, ${color}60, ${color})`,
                    boxShadow: `0 0 8px ${color}30`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        position: 'relative', flexShrink: 0, marginTop: isV ? 40 : 12,
      }}>
        <div style={{ fontSize: isV ? 20 : 11, color: theme.textMuted, fontFamily: FB }}>
          Measuring civilizational stress in the age of AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isV ? 12 : 8 }}>
          <span style={{
            fontSize: isV ? 16 : 8, color: theme.textMuted, fontFamily: FM, letterSpacing: 3,
          }}>
            COMPOSITE
          </span>
          <span style={{
            fontSize: isV ? 36 : 18, fontWeight: 800,
            color: getScoreColor(data.compositeScore, theme), fontFamily: FH,
            textShadow: theme.isDark ? `0 0 16px ${getScoreColor(data.compositeScore, theme)}20` : 'none',
          }}>
            {data.compositeScore.toFixed(1)}
          </span>
        </div>
      </div>
    </Wrap>
  )
}

// ── OVERVIEW ────────────────────────────

function OverviewCard({ data, theme, orientation: o }: {
  data: OverviewCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const sorted = [...data.topDomains].sort((a, b) => b.score - a.score)
  const sc = getScoreColor(data.compositeScore, theme)

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={sc} x="50%" y="25%" size={isV ? 600 : 350} opacity={0.1} />
      <Header theme={theme} label="WEEKLY OVERVIEW" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: isV ? 40 : 16, position: 'relative',
      }}>
        {/* Central score */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isV ? 14 : 8, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, marginBottom: isV ? 12 : 6,
          }}>
            SECURITY PROTOCOL
          </div>
          <div style={{
            fontSize: isV ? 120 : 64, fontWeight: 800, color: sc,
            fontFamily: FH, lineHeight: 0.9, letterSpacing: -2,
            textShadow: theme.isDark ? `0 0 40px ${sc}25` : 'none',
          }}>
            {data.compositeScore.toFixed(1)}
          </div>
          <div style={{
            marginTop: isV ? 16 : 6,
            padding: isV ? '8px 24px' : '4px 14px',
            background: `${sc}18`, display: 'inline-block',
            fontSize: isV ? 20 : 10, fontWeight: 700, color: sc,
            fontFamily: FM, letterSpacing: 3,
          }}>
            {getScoreBand(data.compositeScore)}
          </div>
        </div>

        {data.compositeChange !== null && (
          <div style={{
            fontSize: isV ? 26 : 14, fontWeight: 600, fontFamily: FM,
            color: data.compositeChange > 0 ? theme.scoreColors.high : theme.scoreColors.low,
          }}>
            {data.compositeChange > 0 ? '\u25B2' : '\u25BC'} {Math.abs(data.compositeChange).toFixed(1)} pts from last week
          </div>
        )}

        {/* Domain bars */}
        <div style={{ width: '100%', maxWidth: isV ? 800 : 500 }}>
          <div style={{
            fontSize: isV ? 14 : 8, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, marginBottom: isV ? 20 : 10, textAlign: 'center',
          }}>
            TOP DOMAIN READINGS
          </div>
          {sorted.slice(0, 5).map(d => (
            <DomainBar key={d.domain} domain={d.domain} score={d.score} theme={theme} big={isV} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: 'relative', flexShrink: 0, marginTop: isV ? 32 : 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isV ? '20px 0' : '10px 0',
        borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div style={{
          fontSize: isV ? 22 : 11, color: theme.textSecondary, fontFamily: FB,
        }}>
          How exposed is your job? Take the AI risk quiz.
        </div>
        <div style={{
          padding: isV ? '10px 24px' : '5px 14px',
          background: `${theme.accentSecondary}18`,
          fontSize: isV ? 16 : 8, fontWeight: 700, color: theme.accentSecondary,
          fontFamily: FM, letterSpacing: 2, flexShrink: 0,
        }}>
          thehumanindex.org/quiz
        </div>
      </div>
      <Footer theme={theme} text={`Week ${data.weekNumber}`} isV={isV} />
    </Wrap>
  )
}

// ── LAYOFF ────────────────────────────

function LayoffCard({ data, theme, orientation: o }: {
  data: LayoffCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const amber = theme.accentSecondary // Warning amber for layoff data

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={amber} x="50%" y="30%" size={isV ? 600 : 350} opacity={0.1} />
      <Header theme={theme} label="LAYOFF TRACKER" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: isV ? 'column' : 'row',
        justifyContent: 'center', alignItems: isV ? 'center' : 'flex-start',
        gap: isV ? 56 : 44, position: 'relative',
      }}>
        {/* Big number — amber, cinematic */}
        <div style={{
          textAlign: 'center', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            fontSize: isV ? 18 : 10, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, marginBottom: isV ? 16 : 8,
          }}>
            AFFECTED WORKERS
          </div>
          <div style={{
            fontSize: isV ? 110 : 56, fontWeight: 800, color: amber,
            fontFamily: FH, lineHeight: 0.9, letterSpacing: -2,
            textShadow: theme.isDark ? `0 0 30px ${amber}30` : 'none',
          }}>
            {data.totalAffected}
          </div>
          <div style={{
            marginTop: isV ? 20 : 10,
            fontSize: isV ? 22 : 12, fontWeight: 700, color: amber,
            fontFamily: FH, letterSpacing: 3,
          }}>
            LAYOFFS
          </div>
        </div>

        {/* Companies list */}
        <div style={{
          maxWidth: isV ? 800 : undefined, width: isV ? '100%' : undefined,
          flex: isV ? undefined : 1,
        }}>
          <div style={{
            fontSize: isV ? 16 : 9, color: theme.textMuted, fontFamily: FM,
            letterSpacing: 4, marginBottom: isV ? 20 : 10,
          }}>
            TOP COMPANIES
          </div>
          {data.topCompanies.slice(0, 5).map((c, i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: isV ? '20px 0' : '10px 0',
              borderBottom: i < arr.length - 1
                ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                : 'none',
            }}>
              <div>
                <div style={{
                  fontSize: isV ? 26 : 13, fontWeight: 700, color: theme.text, fontFamily: FH,
                }}>
                  {c.name}
                </div>
                <div style={{
                  fontSize: isV ? 20 : 10, color: theme.textSecondary,
                  marginTop: 4, fontFamily: FB,
                }}>
                  {c.reason}
                </div>
              </div>
              <div style={{
                fontSize: isV ? 24 : 12, fontWeight: 700, color: amber,
                fontFamily: FM, flexShrink: 0, paddingLeft: 20,
              }}>
                {c.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{
        position: 'relative', flexShrink: 0,
        marginTop: isV ? 48 : 20,
        padding: isV ? '28px 32px' : '14px 20px',
        background: `linear-gradient(135deg, ${amber}12, ${amber}06)`,
        display: 'flex', alignItems: isV ? 'center' : 'center',
        justifyContent: 'space-between',
        gap: isV ? 24 : 16,
      }}>
        <div>
          <div style={{
            fontSize: isV ? 28 : 14, fontWeight: 700, color: theme.text,
            fontFamily: FH, lineHeight: 1.3,
          }}>
            Is your job at risk?
          </div>
          <div style={{
            fontSize: isV ? 20 : 10, color: theme.textSecondary,
            fontFamily: FB, marginTop: isV ? 6 : 2,
          }}>
            Take the free AI Exposure Quiz
          </div>
        </div>
        <div style={{
          padding: isV ? '12px 28px' : '6px 16px',
          background: amber,
          fontSize: isV ? 18 : 9, fontWeight: 700, color: '#0A192F',
          fontFamily: FM, letterSpacing: 2, flexShrink: 0,
          textTransform: 'uppercase',
        }}>
          ANALYZE RISK
        </div>
      </div>

      <Footer theme={theme} text="thehumanindex.org/quiz" isV={isV} />
    </Wrap>
  )
}

// ── DASHBOARD ────────────────────────────

function DashboardCard({ data, theme, orientation: o }: {
  data: DashboardCardData; theme: CardTheme; orientation: CardOrientation
}) {
  const isV = o === 'vertical'
  const sc = getScoreColor(data.compositeScore, theme)
  const sorted = [...data.domains].sort((a, b) => b.score - a.score).slice(0, 5)
  const cyan = theme.accent
  const amber = theme.accentSecondary

  // Mini sparkline: compute bar heights from trend data
  const trendMax = Math.max(...data.trend.map(t => t.score), 1)
  const trendMin = Math.min(...data.trend.map(t => t.score), 0)
  const trendRange = Math.max(trendMax - trendMin, 5)

  return (
    <Wrap theme={theme} orientation={o}>
      <AmbientGlow color={cyan} x="20%" y="15%" size={isV ? 600 : 350} opacity={0.08} />
      <AmbientGlow color={sc} x="80%" y="70%" size={isV ? 500 : 300} opacity={0.06} />
      <Header theme={theme} label="DASHBOARD" date={data.date} isV={isV} />

      <div style={{
        flex: 1, display: 'flex',
        flexDirection: isV ? 'column' : 'row',
        gap: isV ? 48 : 40,
        position: 'relative',
      }}>
        {/* LEFT COLUMN: Score + Trend */}
        <div style={{
          flex: isV ? undefined : '0 0 45%',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: isV ? 40 : 20,
        }}>
          {/* Score block */}
          <div style={{ textAlign: isV ? 'center' : 'left' }}>
            <div style={{
              fontSize: isV ? 16 : 8, color: theme.textMuted, fontFamily: FM,
              letterSpacing: 4, marginBottom: isV ? 12 : 6,
            }}>
              COMPOSITE INDEX
            </div>
            <div style={{ display: 'flex', alignItems: isV ? 'center' : 'flex-end', gap: isV ? 24 : 14, justifyContent: isV ? 'center' : 'flex-start' }}>
              <div style={{
                fontSize: isV ? 120 : 64, fontWeight: 800, color: sc,
                fontFamily: FH, lineHeight: 0.9, letterSpacing: -2,
                textShadow: theme.isDark ? `0 0 30px ${sc}25` : 'none',
              }}>
                {data.compositeScore.toFixed(1)}
              </div>
              <div style={{ paddingBottom: isV ? 8 : 4 }}>
                <div style={{
                  padding: isV ? '8px 20px' : '4px 12px',
                  background: `${sc}18`,
                  fontSize: isV ? 18 : 10, fontWeight: 700, color: sc,
                  fontFamily: FM, letterSpacing: 3,
                }}>
                  {data.band.toUpperCase()}
                </div>
                {data.delta !== null && (
                  <div style={{
                    fontSize: isV ? 22 : 12, fontWeight: 600, fontFamily: FM,
                    color: data.delta > 0 ? theme.scoreColors.high : theme.scoreColors.low,
                    marginTop: isV ? 10 : 4,
                  }}>
                    {data.delta > 0 ? '\u25B2' : '\u25BC'} {Math.abs(data.delta).toFixed(1)} pts
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mini Trend Sparkline */}
          {data.trend.length > 1 && (
            <div>
              <div style={{
                fontSize: isV ? 14 : 8, color: theme.textMuted, fontFamily: FM,
                letterSpacing: 4, marginBottom: isV ? 14 : 8,
              }}>
                TREND ({data.trend.length} MONTHS)
              </div>
              <div style={{
                display: 'flex', alignItems: 'flex-end',
                gap: isV ? 6 : 3, height: isV ? 80 : 44,
              }}>
                {data.trend.map((t, i) => {
                  const pct = ((t.score - trendMin) / trendRange) * 100
                  const barColor = getScoreColor(t.score, theme)
                  return (
                    <div key={i} style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'flex-end', height: '100%',
                    }}>
                      <div style={{
                        width: '100%', minHeight: isV ? 4 : 2,
                        height: `${Math.max(pct, 5)}%`,
                        background: `linear-gradient(180deg, ${barColor}, ${barColor}60)`,
                        boxShadow: theme.isDark ? `0 0 8px ${barColor}20` : 'none',
                      }} />
                      <div style={{
                        fontSize: isV ? 11 : 6, color: theme.textMuted,
                        fontFamily: FM, marginTop: isV ? 6 : 3, letterSpacing: 0.5,
                      }}>
                        {t.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Data Pipeline Status */}
          <div style={{
            padding: isV ? '20px 24px' : '10px 14px',
            background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          }}>
            <div style={{
              fontSize: isV ? 14 : 8, color: theme.textMuted, fontFamily: FM,
              letterSpacing: 4, marginBottom: isV ? 14 : 8,
            }}>
              DATA PIPELINE
            </div>
            <div style={{
              display: 'flex', gap: isV ? 32 : 18, alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: isV ? 36 : 20, fontWeight: 700, color: cyan, fontFamily: FH }}>
                  {data.connectedSources.length}/{data.totalSources}
                </div>
                <div style={{ fontSize: isV ? 14 : 7, color: theme.textMuted, fontFamily: FM, letterSpacing: 2 }}>
                  SOURCES
                </div>
              </div>
              <div>
                <div style={{ fontSize: isV ? 36 : 20, fontWeight: 700, color: theme.text, fontFamily: FH }}>
                  {data.indicatorCount}
                </div>
                <div style={{ fontSize: isV ? 14 : 7, color: theme.textMuted, fontFamily: FM, letterSpacing: 2 }}>
                  INDICATORS
                </div>
              </div>
              <div>
                <div style={{ fontSize: isV ? 36 : 20, fontWeight: 700, color: theme.text, fontFamily: FH }}>
                  {data.activeDomains}/{data.totalDomains}
                </div>
                <div style={{ fontSize: isV ? 14 : 7, color: theme.textMuted, fontFamily: FM, letterSpacing: 2 }}>
                  DOMAINS
                </div>
              </div>
            </div>
            {/* Source badges */}
            <div style={{
              display: 'flex', gap: isV ? 8 : 4, flexWrap: 'wrap',
              marginTop: isV ? 14 : 8,
            }}>
              {data.connectedSources.map(s => (
                <span key={s} style={{
                  fontSize: isV ? 13 : 7, padding: isV ? '5px 12px' : '2px 7px',
                  background: `${cyan}15`, color: cyan,
                  fontFamily: FM, letterSpacing: 1,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Top Domains + Insight */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: isV ? 36 : 16,
        }}>
          {/* Domain bars */}
          <div>
            <div style={{
              fontSize: isV ? 14 : 8, color: theme.textMuted, fontFamily: FM,
              letterSpacing: 4, marginBottom: isV ? 20 : 10,
            }}>
              TOP RISK DOMAINS
            </div>
            {sorted.map(d => (
              <DomainBar key={d.domain} domain={d.domain} score={d.score} theme={theme} big={isV} />
            ))}
          </div>

          {/* Correlation Insight */}
          {data.topInsight && (
            <div style={{
              padding: isV ? '24px 28px' : '12px 16px',
              background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderLeft: `3px solid ${amber}`,
            }}>
              <div style={{
                fontSize: isV ? 14 : 7, color: amber, fontFamily: FM,
                letterSpacing: 4, marginBottom: isV ? 12 : 6,
              }}>
                CROSS-DOMAIN INSIGHT
              </div>
              <div style={{
                fontSize: isV ? 24 : 12, color: theme.textSecondary,
                fontFamily: FB, lineHeight: 1.5,
              }}>
                {truncate(data.topInsight, isV ? 180 : 120)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: 'relative', flexShrink: 0, marginTop: isV ? 32 : 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isV ? '20px 0' : '10px 0',
        borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div style={{
          fontSize: isV ? 22 : 11, color: theme.textSecondary, fontFamily: FB,
        }}>
          Explore the full dashboard at thehumanindex.org
        </div>
        <div style={{
          padding: isV ? '10px 24px' : '5px 14px',
          background: `${cyan}18`,
          fontSize: isV ? 16 : 8, fontWeight: 700, color: cyan,
          fontFamily: FM, letterSpacing: 2, flexShrink: 0,
        }}>
          thehumanindex.org/dashboard
        </div>
      </div>
      <Footer theme={theme} isV={isV} />
    </Wrap>
  )
}

// ── Main Renderer ───────────────────────────────

export function ShareCardRenderer({ data, theme, orientation = 'horizontal' }: {
  data: ShareCardData; theme: CardTheme; orientation?: CardOrientation
}) {
  switch (data.type) {
    case 'composite': return <CompositeCard data={data} theme={theme} orientation={orientation} />
    case 'domain': return <DomainCard data={data} theme={theme} orientation={orientation} />
    case 'pulse': return <PulseCard data={data} theme={theme} orientation={orientation} />
    case 'quiz': return <QuizCard data={data} theme={theme} orientation={orientation} />
    case 'trend': return <TrendCard data={data} theme={theme} orientation={orientation} />
    case 'overview': return <OverviewCard data={data} theme={theme} orientation={orientation} />
    case 'layoff': return <LayoffCard data={data} theme={theme} orientation={orientation} />
    case 'dashboard': return <DashboardCard data={data} theme={theme} orientation={orientation} />
  }
}
