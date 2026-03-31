'use client'

import { QuizResult } from '@/lib/types'
import html2canvas from 'html2canvas'
import { useRef } from 'react'
import { BandLabel } from './BandLabel'
import { useTheme } from '@/lib/theme'

interface ShareCardProps {
  result: QuizResult
}

export function ShareCard({ result }: ShareCardProps) {
  const { theme } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: theme.bg,
        scale: 2,
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `the-human-index-${Date.now()}.png`
      link.click()
    } catch (error) {
      console.error('Failed to download card:', error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        ref={cardRef}
        style={{
          background: `linear-gradient(135deg, ${theme.surface}, ${theme.bg})`,
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 12,
          padding: 32,
          maxWidth: 360,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: theme.text, fontSize: 12, fontWeight: 600, letterSpacing: 3, marginBottom: 20, fontFamily: theme.fontBody, textTransform: 'uppercase' }}>THE HUMAN INDEX</h3>
          <p style={{ color: theme.textTertiary, fontSize: 13, marginBottom: 4, fontFamily: theme.fontBody }}>Exposure Score for</p>
          <p style={{ color: theme.text, fontSize: 20, fontWeight: 700, marginBottom: 20, fontFamily: theme.fontHeading }}>{result.share_card_data.job_title}</p>
          <div style={{ padding: '16px 0' }}>
            <BandLabel band={result.exposure_band} size="lg" />
          </div>
          <p style={{ color: theme.textTertiary, fontSize: 12, marginTop: 16, marginBottom: 4, fontFamily: theme.fontBody }}>You are in the</p>
          <p style={{ color: theme.text, fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: theme.fontHeading }}>{result.share_card_data.percentile_text}</p>
          <div style={{ borderTop: `1px solid ${theme.surfaceBorder}`, paddingTop: 16, marginTop: 8 }}>
            <p style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4, fontFamily: theme.fontBody }}>{result.share_card_data.region}</p>
            <p style={{ color: theme.textTertiary, fontSize: 11, opacity: 0.6, fontFamily: theme.fontBody }}>thehumanindex.com</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={downloadCard}
          style={{ padding: '8px 20px', background: theme.accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontBody }}
        >
          Download Card
        </button>
        <button
          onClick={() => {
            const url = `https://thehumanindex.com/quiz/result?band=${result.exposure_band}&percentile=${result.percentile}`
            navigator.clipboard.writeText(url)
          }}
          style={{ padding: '8px 20px', background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontBody }}
        >
          Copy Link
        </button>
      </div>
    </div>
  )
}
