'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import { ShareCardModal } from './ShareCardModal'
import type { OverviewCardData } from './ShareCardRenderer'
import type { Domain } from '@/lib/types'

export interface SharePromptProps {
  compositeScore: number
  band: string
  delta: number | null
  topDomains: { domain: Domain; score: number; delta: number }[]
  date: string
  weekNumber: number
}

// Module-level flag to track if we've shown the prompt in this session
let hasShownSharePrompt = false
let isDismissedForSession = false

export function SharePrompt({
  compositeScore,
  band,
  delta,
  topDomains,
  date,
  weekNumber,
}: SharePromptProps) {
  const { theme } = useTheme()
  const [show, setShow] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    // Only set up timer if we haven't shown it yet and it's not dismissed
    if (hasShownSharePrompt || isDismissedForSession) {
      return
    }

    const timer = setTimeout(() => {
      if (!isDismissedForSession) {
        setShow(true)
        setIsVisible(true)
        hasShownSharePrompt = true
      }
    }, 25000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => setShow(false), 300)
  }

  const handleDontShowAgain = () => {
    isDismissedForSession = true
    handleDismiss()
  }

  const handleShareNow = () => {
    handleDismiss()
    setShareModalOpen(true)
  }

  // Build the overview card data for the modal
  const overviewCardData: OverviewCardData = {
    type: 'overview',
    compositeScore,
    compositeChange: delta,
    band,
    topDomains,
    date,
    weekNumber,
  }

  if (!show) return null

  return (
    <>
      {/* Share Prompt Slide-in Card */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 340,
            background: theme.surface,
            border: `1px solid ${theme.accent}40`,
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(400px) translateY(100px)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.textTertiary,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textTertiary }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div style={{ paddingRight: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 12 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: theme.text,
                  margin: 0,
                  fontFamily: theme.fontHeading,
                }}
              >
                Share the Data
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  margin: '4px 0 0',
                  fontFamily: theme.fontBody,
                }}
              >
                Help your network stay informed
              </p>
            </div>

            {/* Mini Preview */}
            <div
              style={{
                background: `${theme.accent}08`,
                border: `1px solid ${theme.accent}20`,
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Score Preview */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 11,
                    color: theme.textTertiary,
                    fontFamily: theme.fontMono,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Index Score
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.accent,
                    fontFamily: theme.fontMono,
                  }}
                >
                  {compositeScore.toFixed(1)}
                </span>
              </div>

              {/* Band */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: theme.textTertiary,
                    fontFamily: theme.fontMono,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Status
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.text,
                    fontFamily: theme.fontBody,
                  }}
                >
                  {band}
                </span>
              </div>

              {/* Delta if available */}
              {delta !== null && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: theme.textTertiary,
                      fontFamily: theme.fontMono,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Change
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: delta > 0 ? theme.accent : theme.textSecondary,
                      fontFamily: theme.fontMono,
                    }}
                  >
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button
                onClick={handleShareNow}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.accent,
                  color: theme.id === 'briefing' ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: theme.fontBody,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1'
                }}
              >
                Share Now
              </button>

              <button
                onClick={handleDontShowAgain}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  color: theme.textSecondary,
                  border: `1px solid ${theme.surfaceBorder}`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: theme.fontBody,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.borderColor = theme.textSecondary
                  btn.style.color = theme.text
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.borderColor = theme.surfaceBorder
                  btn.style.color = theme.textSecondary
                }}
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Card Modal */}
      <ShareCardModal
        data={overviewCardData}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  )
}
