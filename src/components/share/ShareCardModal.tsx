'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { useTheme } from '@/lib/theme'
import { CardStyle, CardOrientation, CARD_THEMES } from './cardStyles'
import { ShareCardData, ShareCardRenderer } from './ShareCardRenderer'

interface ShareCardModalProps {
  data: ShareCardData
  open: boolean
  onClose: () => void
}

export function ShareCardModal({ data, open, onClose }: ShareCardModalProps) {
  const { theme } = useTheme()
  const [style, setStyle] = useState<CardStyle>('terminal')
  const [orientation, setOrientation] = useState<CardOrientation>('horizontal')
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  // Separate refs: one for the visible preview, one for the hidden full-size capture target
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) { setCopied(false); setDownloaded(false) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const dims = orientation === 'horizontal'
    ? { width: 1200, height: 630 }
    : { width: 1080, height: 1920 }

  const captureCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!captureRef.current) return null
    setExporting(true)
    try {
      // html2canvas captures the hidden full-size element (no CSS transform)
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: dims.width,
        height: dims.height,
      })
      return canvas
    } catch (err) {
      console.error('Failed to capture card:', err)
      return null
    } finally {
      setExporting(false)
    }
  }, [dims.width, dims.height])

  const handleDownload = useCallback(async () => {
    const canvas = await captureCard()
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `human-index-${data.type}-${orientation}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }, [captureCard, data.type, orientation])

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
      handleDownload()
    }
  }, [captureCard, handleDownload])

  if (!open) return null

  const cardTheme = CARD_THEMES[style]
  const previewMaxWidth = orientation === 'horizontal' ? 640 : 320

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
      {/*
        HIDDEN full-size card for html2canvas capture.
        Positioned off-screen so it doesn't affect layout,
        but NOT display:none (html2canvas needs it rendered).
      */}
      <div style={{
        position: 'fixed',
        left: -9999,
        top: 0,
        width: dims.width,
        height: dims.height,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div ref={captureRef} style={{ width: dims.width, height: dims.height }}>
          <ShareCardRenderer data={data} theme={cardTheme} orientation={orientation} />
        </div>
      </div>

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

        {/* Orientation picker */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
            Choose Orientation
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setOrientation('horizontal')}
              style={{
                flex: 1, padding: '12px 16px',
                background: orientation === 'horizontal' ? `${theme.accent}15` : 'transparent',
                border: `1px solid ${orientation === 'horizontal' ? theme.accent + '60' : theme.surfaceBorder}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: theme.text }}>
                <rect x="3" y="7" width="18" height="10" rx="1" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: orientation === 'horizontal' ? (theme.isDark ? '#fff' : theme.text) : theme.textSecondary }}>
                  Horizontal
                </div>
                <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 2 }}>
                  1200x630
                </div>
              </div>
            </button>

            <button
              onClick={() => setOrientation('vertical')}
              style={{
                flex: 1, padding: '12px 16px',
                background: orientation === 'vertical' ? `${theme.accent}15` : 'transparent',
                border: `1px solid ${orientation === 'vertical' ? theme.accent + '60' : theme.surfaceBorder}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: theme.text }}>
                <rect x="7" y="3" width="10" height="18" rx="1" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: orientation === 'vertical' ? (theme.isDark ? '#fff' : theme.text) : theme.textSecondary }}>
                  Vertical
                </div>
                <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 2 }}>
                  1080x1920
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Card preview — uses CSS scale for display only, NOT used for capture */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%',
            maxWidth: previewMaxWidth,
            aspectRatio: `${dims.width} / ${dims.height}`,
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid ${theme.surfaceBorder}`,
            position: 'relative',
            background: '#000',
          }}>
            <div
              style={{
                width: dims.width,
                height: dims.height,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              ref={(el) => {
                if (el) {
                  const parent = el.parentElement
                  if (parent) {
                    const scale = parent.clientWidth / dims.width
                    el.style.transform = `scale(${scale})`
                  }
                }
              }}
            >
              <ShareCardRenderer data={data} theme={cardTheme} orientation={orientation} />
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
