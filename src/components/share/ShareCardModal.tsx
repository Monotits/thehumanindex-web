'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { useTheme } from '@/lib/theme'
import { CardStyle, CARD_THEMES } from './cardStyles'
import { ShareCardData, ShareCardRenderer } from './ShareCardRenderer'

interface ShareCardModalProps {
  data: ShareCardData
  open: boolean
  onClose: () => void
}

export function ShareCardModal({ data, open, onClose }: ShareCardModalProps) {
  const { theme } = useTheme()
  const [style, setStyle] = useState<CardStyle>('terminal')
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Reset states when modal opens
  useEffect(() => {
    if (open) {
      setCopied(false)
      setDownloaded(false)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const captureCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null
    setExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: 1200,
        height: 630,
      })
      return canvas
    } catch (err) {
      console.error('Failed to capture card:', err)
      return null
    } finally {
      setExporting(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    const canvas = await captureCard()
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `human-index-${data.type}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }, [captureCard, data.type])

  const handleCopy = useCallback(async () => {
    const canvas = await captureCard()
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }, 'image/png')
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback: download instead
      handleDownload()
    }
  }, [captureCard, handleDownload])

  if (!open) return null

  const cardTheme = CARD_THEMES[style]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.surfaceBorder}`,
        borderRadius: 16,
        maxWidth: 720,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 0,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.surfaceBorder}`,
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.isDark ? '#fff' : theme.text, margin: 0, fontFamily: theme.fontHeading }}>
              Share Card
            </h3>
            <p style={{ fontSize: 12, color: theme.textTertiary, margin: '4px 0 0' }}>
              Download or copy as image to share on social media
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.textTertiary, padding: 8, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Style picker */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
            Choose Style
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.keys(CARD_THEMES) as CardStyle[]).map(s => {
              const t = CARD_THEMES[s]
              const active = s === style
              return (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: active ? `${theme.accent}15` : 'transparent',
                    border: `1px solid ${active ? theme.accent + '60' : theme.surfaceBorder}`,
                    borderRadius: 10, cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Style preview swatch */}
                  <div style={{
                    width: '100%', height: 24, borderRadius: 4, marginBottom: 8,
                    background: t.bgGradient,
                    border: `1px solid ${t.cardBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent }} />
                    <div style={{ width: 16, height: 3, borderRadius: 2, background: t.text, opacity: 0.5 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? (theme.isDark ? '#fff' : theme.text) : theme.textSecondary }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 2 }}>
                    {t.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Card preview */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%',
            maxWidth: 640,
            aspectRatio: '1200 / 630',
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid ${theme.surfaceBorder}`,
            position: 'relative',
          }}>
            {/* Scaled preview */}
            <div style={{
              width: 1200, height: 630,
              transform: 'scale(var(--card-scale))',
              transformOrigin: 'top left',
              position: 'absolute', top: 0, left: 0,
            }}
            ref={(el) => {
              if (el) {
                const parent = el.parentElement
                if (parent) {
                  const scale = parent.clientWidth / 1200
                  el.style.setProperty('--card-scale', String(scale))
                  el.style.transform = `scale(${scale})`
                }
              }
            }}
            >
              <div ref={cardRef}>
                <ShareCardRenderer data={data} theme={cardTheme} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: `1px solid ${theme.surfaceBorder}`,
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={handleDownload}
            disabled={exporting}
            style={{
              flex: 1, padding: '12px 0',
              background: theme.accent,
              color: theme.id === 'briefing' ? '#fff' : '#000',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: exporting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {downloaded ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Downloaded!
              </>
            ) : exporting ? (
              'Generating...'
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download PNG
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={exporting}
            style={{
              flex: 1, padding: '12px 0',
              background: 'transparent',
              color: theme.isDark ? '#fff' : theme.text,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
