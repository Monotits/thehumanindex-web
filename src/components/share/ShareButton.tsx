'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme'
import { ShareCardData } from './ShareCardRenderer'
import { ShareCardModal } from './ShareCardModal'
import posthog from 'posthog-js'

interface ShareButtonProps {
  data: ShareCardData
  /** Visual style: icon-only, or button with text */
  variant?: 'icon' | 'button' | 'compact'
  label?: string
  style?: React.CSSProperties
}

export function ShareButton({ data, variant = 'button', label = 'Share', style: customStyle }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const { theme } = useTheme()

  const handleOpen = () => {
    posthog.capture('share_card_opened', { card_type: data.type, variant })
    setOpen(true)
  }

  const ShareIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleOpen}
          title="Share as image"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textTertiary, padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.2s',
            ...customStyle,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = theme.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = theme.textTertiary)}
        >
          <ShareIcon />
        </button>
        <ShareCardModal data={data} open={open} onClose={() => setOpen(false)} />
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleOpen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'none',
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 6, cursor: 'pointer',
            color: theme.textSecondary,
            padding: '4px 10px',
            fontSize: 11, fontWeight: 500,
            transition: 'all 0.2s',
            ...customStyle,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = theme.accent + '60'
            e.currentTarget.style.color = theme.accent
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = theme.surfaceBorder
            e.currentTarget.style.color = theme.textSecondary
          }}
        >
          <ShareIcon />
          {label}
        </button>
        <ShareCardModal data={data} open={open} onClose={() => setOpen(false)} />
      </>
    )
  }

  // Default: full button
  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: `${theme.accent}15`,
          border: `1px solid ${theme.accent}30`,
          borderRadius: 8, cursor: 'pointer',
          color: theme.accent,
          padding: '8px 16px',
          fontSize: 13, fontWeight: 600,
          transition: 'all 0.2s',
          ...customStyle,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = `${theme.accent}25`
          e.currentTarget.style.borderColor = theme.accent + '60'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = `${theme.accent}15`
          e.currentTarget.style.borderColor = theme.accent + '30'
        }}
      >
        <ShareIcon />
        {label}
      </button>
      <ShareCardModal data={data} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
