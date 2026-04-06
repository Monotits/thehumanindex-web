'use client'

import { QuizResult, Band } from '@/lib/types'
import html2canvas from 'html2canvas'
import { useRef, useState } from 'react'
import { useTheme } from '@/lib/theme'

// ── Brand Design System ──────────────────────────
const NAVY = '#0A192F'
const CYAN = '#00E5FF'
const AMBER = '#FFB800'

const SCORE_COLORS: Record<string, string> = {
  low: '#22D68A',
  moderate: '#00E5FF',
  elevated: '#FFB800',
  high: '#FF8A3D',
  critical: '#FF4757',
}

const FH = 'Helvetica, Arial, sans-serif'
const FB = 'Arial, Helvetica, sans-serif'
const FM = '"Courier New", Courier, monospace'

interface ShareCardProps {
  result: QuizResult
}

// ── Gauge (half-circle arc) ──────────────────────
function Gauge({ percentile, color, size = 'normal' }: { percentile: number; color: string; size?: 'normal' | 'large' }) {
  const isLg = size === 'large'
  const w = isLg ? 220 : 160
  const h = isLg ? 120 : 90
  const cx = w / 2
  const cy = isLg ? 105 : 78
  const r = isLg ? 90 : 65
  const strokeW = isLg ? 10 : 8

  const startAngle = 180
  const endAngle = 0
  const sweepAngle = (percentile / 100) * 180
  const currentAngle = startAngle - sweepAngle

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const px = (deg: number) => cx + r * Math.cos(toRad(deg))
  const py = (deg: number) => cy - r * Math.sin(toRad(deg))

  const bgPath = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 0 1 ${px(endAngle)} ${py(endAngle)}`
  const largeArc = sweepAngle > 180 ? 1 : 0
  const valPath = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${px(currentAngle)} ${py(currentAngle)}`

  const tipX = px(currentAngle)
  const tipY = py(currentAngle)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: 'block', margin: '0 auto' }}>
      {/* Glow filter */}
      <defs>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} strokeLinecap="round" />
      {/* Value arc with glow */}
      <path d={valPath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" filter="url(#gaugeGlow)" />
      {/* Tip dot */}
      <circle cx={tipX} cy={tipY} r={isLg ? 6 : 4} fill="#fff" />
      <circle cx={tipX} cy={tipY} r={isLg ? 10 : 7} fill={color} opacity="0.25" />
    </svg>
  )
}

// ── Shield Logo ──────────────────────────
function ShieldLogo({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 24 29" fill="none" style={{ flexShrink: 0 }}>
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

export function ShareCard({ result }: ShareCardProps) {
  const { theme } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const band = result.exposure_band as Band
  const bandColor = SCORE_COLORS[band] || AMBER
  const percentile = result.percentile
  const topTasks = result.top_tasks_at_risk?.slice(0, 3) || []

  const downloadCard = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: NAVY,
        scale: 3,
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `human-index-${result.share_card_data.job_title.replace(/\s+/g, '-').toLowerCase()}.png`
      link.click()
    } catch (error) {
      console.error('Failed to download card:', error)
    }
  }

  const shareToX = () => {
    const text = `My AI exposure score: ${result.share_card_data.band} (${result.share_card_data.percentile_text}) as a ${result.share_card_data.job_title}. Check yours at thehumanindex.org/quiz`
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  const copyLink = () => {
    navigator.clipboard.writeText('https://thehumanindex.org/quiz')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── The Card ── */}
      <div
        ref={cardRef}
        style={{
          background: `linear-gradient(160deg, ${NAVY}, #060D1B)`,
          borderRadius: 12,
          padding: '28px 24px 20px',
          maxWidth: 360,
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Scan lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)`,
        }} />

        {/* Noise texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }} />

        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${bandColor}12, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldLogo color={CYAN} size={14} />
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontFamily: FH,
            }}>
              THE HUMAN INDEX
            </span>
          </div>
          <span style={{
            padding: '2px 8px',
            background: `${CYAN}15`,
            fontSize: 8, fontWeight: 700, color: CYAN,
            fontFamily: FM, letterSpacing: 2,
          }}>
            AI EXPOSURE
          </span>
        </div>

        {/* ── Gauge + Score ── */}
        <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative' }}>
          <Gauge percentile={percentile} color={bandColor} />
          <div style={{ marginTop: -4 }}>
            <span style={{
              fontSize: 48, fontWeight: 800, color: bandColor,
              lineHeight: 1, letterSpacing: -2, fontFamily: FH,
              textShadow: `0 0 30px ${bandColor}25`,
            }}>
              {percentile}
            </span>
            <span style={{
              fontSize: 16, color: 'rgba(255,255,255,0.3)',
              marginLeft: 2, fontWeight: 500, fontFamily: FM,
            }}>
              /100
            </span>
          </div>
        </div>

        {/* ── Band badge ── */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            display: 'inline-block',
            padding: '5px 18px',
            background: `${bandColor}18`,
            color: bandColor,
            fontSize: 11, fontWeight: 700,
            letterSpacing: 3, fontFamily: FM,
          }}>
            {result.share_card_data.band}
          </span>
        </div>

        {/* ── Job title ── */}
        <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative' }}>
          <div style={{
            fontSize: 9, color: 'rgba(255,255,255,0.3)',
            marginBottom: 6, textTransform: 'uppercase',
            letterSpacing: 3, fontFamily: FM,
          }}>
            EXPOSURE SCORE FOR
          </div>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#fff',
            lineHeight: 1.3, fontFamily: FH,
          }}>
            {result.share_card_data.job_title}
          </div>
          {result.share_card_data.region && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.25)',
              marginTop: 4, fontFamily: FB,
            }}>
              {result.share_card_data.region}
            </div>
          )}
        </div>

        {/* ── Top risk tasks ── */}
        {topTasks.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '14px 16px',
            marginBottom: 16, position: 'relative',
          }}>
            <div style={{
              fontSize: 8, color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: 3,
              marginBottom: 12, fontFamily: FM,
            }}>
              TOP TASKS AT RISK
            </div>
            {topTasks.map((task, i) => {
              const pct = Math.round(task.exposure * 100)
              const taskColor = pct >= 70 ? SCORE_COLORS.high : pct >= 50 ? AMBER : CYAN
              return (
                <div key={i} style={{ marginBottom: i < topTasks.length - 1 ? 10 : 0 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 4,
                  }}>
                    <span style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.6)',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', maxWidth: '72%', fontFamily: FB,
                    }}>
                      {task.task}
                    </span>
                    <span style={{
                      fontSize: 11, color: taskColor,
                      fontWeight: 700, fontFamily: FM,
                    }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{
                    height: 3, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: `linear-gradient(90deg, ${taskColor}60, ${taskColor})`,
                      boxShadow: `0 0 8px ${taskColor}30`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative',
        }}>
          <span style={{
            fontSize: 9, color: 'rgba(255,255,255,0.2)',
            fontFamily: FM, letterSpacing: 1,
          }}>
            thehumanindex.org
          </span>
          <span style={{
            fontSize: 9, color: 'rgba(255,255,255,0.15)',
            fontFamily: FM, letterSpacing: 1,
          }}>
            {result.share_card_data.percentile_text}
          </span>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={downloadCard}
          style={{
            padding: '9px 18px',
            background: theme.accent,
            border: 'none',
            borderRadius: 8,
            color: theme.isDark ? '#000' : '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: theme.fontBody,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Save Image
        </button>
        <button
          onClick={shareToX}
          style={{
            padding: '9px 18px',
            background: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 8,
            color: theme.text,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: theme.fontBody,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share
        </button>
        <button
          onClick={copyLink}
          style={{
            padding: '9px 18px',
            background: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 8,
            color: copied ? theme.accent : theme.text,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: theme.fontBody,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 0.2s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {copied
              ? <path d="M20 6L9 17l-5-5" />
              : <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>
            }
          </svg>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
