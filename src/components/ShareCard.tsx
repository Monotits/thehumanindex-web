'use client'

import { QuizResult, BAND_COLORS, Band } from '@/lib/types'
import html2canvas from 'html2canvas'
import { useRef, useState } from 'react'
import { useTheme } from '@/lib/theme'

interface ShareCardProps {
  result: QuizResult
}

function GaugeMini({ percentile, bandColor }: { percentile: number; bandColor: string }) {
  const cx = 80, cy = 80, r = 65
  const startAngle = 180
  const endAngle = 0
  const sweepAngle = (percentile / 100) * (startAngle - endAngle)
  const currentAngle = startAngle - sweepAngle

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const px = (deg: number) => cx + r * Math.cos(toRad(deg))
  const py = (deg: number) => cy - r * Math.sin(toRad(deg))

  // Background arc
  const bgPath = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 0 1 ${px(endAngle)} ${py(endAngle)}`
  // Value arc
  const largeArc = sweepAngle > 180 ? 1 : 0
  const valPath = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${px(currentAngle)} ${py(currentAngle)}`

  // Needle tip position
  const needleX = px(currentAngle)
  const needleY = py(currentAngle)

  return (
    <svg viewBox="0 0 160 95" width="160" height="95">
      {/* Background track */}
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
      {/* Value arc */}
      <path d={valPath} fill="none" stroke={bandColor} strokeWidth="8" strokeLinecap="round" />
      {/* Glow */}
      <circle cx={needleX} cy={needleY} r="5" fill={bandColor} opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={needleX} cy={needleY} r="3" fill="#fff" />
    </svg>
  )
}

export function ShareCard({ result }: ShareCardProps) {
  const { theme } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const bandColor = BAND_COLORS[result.exposure_band as Band] || '#f59e0b'
  const percentile = result.percentile

  const downloadCard = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0f',
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

  // Risk tasks for the card (top 3)
  const topTasks = result.top_tasks_at_risk?.slice(0, 3) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        ref={cardRef}
        style={{
          background: '#0a0a0f',
          borderRadius: 16,
          padding: '32px 28px 24px',
          maxWidth: 340,
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${bandColor}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Top brand bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Figure-8 icon placeholder */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="5" stroke={bandColor} strokeWidth="2" />
              <circle cx="12" cy="16" r="5" stroke={bandColor} strokeWidth="2" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              The Human Index
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            2026
          </span>
        </div>

        {/* Gauge + Score */}
        <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative' }}>
          <GaugeMini percentile={percentile} bandColor={bandColor} />
          <div style={{ marginTop: -8 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
              {percentile}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginLeft: 2, fontWeight: 500 }}>
              /100
            </span>
          </div>
        </div>

        {/* Band badge */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 20px',
            borderRadius: 24,
            background: `${bandColor}18`,
            border: `1.5px solid ${bandColor}50`,
            color: bandColor,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {result.share_card_data.band}
          </span>
        </div>

        {/* Job title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            Exposure Score for
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {result.share_card_data.job_title}
          </div>
          {result.share_card_data.region && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              {result.share_card_data.region}
            </div>
          )}
        </div>

        {/* Top risk tasks (mini bars) */}
        {topTasks.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              Top tasks at risk
            </div>
            {topTasks.map((task, i) => (
              <div key={i} style={{ marginBottom: i < topTasks.length - 1 ? 8 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {task.task}
                  </span>
                  <span style={{ fontSize: 10, color: bandColor, fontWeight: 600, fontFamily: 'monospace' }}>
                    {Math.round(task.exposure * 100)}%
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${task.exposure * 100}%`, height: '100%', background: `linear-gradient(90deg, ${bandColor}80, ${bandColor})`, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            thehumanindex.org
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
            {result.share_card_data.percentile_text}
          </span>
        </div>
      </div>

      {/* Action buttons */}
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
