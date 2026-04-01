'use client'

import { Domain } from '@/lib/types'

interface DomainIconProps {
  domain: Domain
  size?: number
  color?: string
  style?: React.CSSProperties
}

/**
 * Minimal line-art SVG icons for each domain.
 * Uses currentColor by default so they inherit theme colors.
 */
export function DomainIcon({ domain, size = 20, color, style }: DomainIconProps) {
  const c = color || 'currentColor'
  const s = { width: size, height: size, flexShrink: 0, ...style }

  switch (domain) {
    // AI Work Displacement — circuit/brain chip
    case 'work_risk':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 6V4M15 6V4M9 20v-2M15 20v-2M6 9H4M6 15H4M20 9h-2M20 15h-2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 10v-1M12 15v-1M10 12H9M15 12h-1" />
        </svg>
      )

    // Income Inequality — scale/balance
    case 'inequality':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M12 3v18" />
          <path d="M8 21h8" />
          <path d="M4 8l4 6h0a2 2 0 004 0h0l4-6" />
          <path d="M16 8l4 6h0a2 2 0 004 0h0" transform="translate(-8,0)" />
          <path d="M5 7h14" />
          <path d="M3.5 14a2.5 2.5 0 005 0" />
          <path d="M15.5 14a2.5 2.5 0 005 0" />
          <path d="M6 7l-3 7M18 7l3 7" />
        </svg>
      )

    // Social Unrest — raised fist
    case 'unrest':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M9 17v-4a1 1 0 011-1h0a1 1 0 011 1v1" />
          <path d="M11 13v-2a1 1 0 011-1h0a1 1 0 011 1v2" />
          <path d="M13 12v-2a1 1 0 011-1h0a1 1 0 011 1v3" />
          <path d="M15 13v-1a1 1 0 011-1h0a1 1 0 011 1v4a5 5 0 01-5 5h-1a5 5 0 01-5-5v-2a1 1 0 011-1h0a1 1 0 011 1v2" />
          <path d="M9 13V6a1 1 0 012 0v5" />
        </svg>
      )

    // Institutional Decay — cracked pillar
    case 'decay':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M4 21h16" />
          <path d="M6 21V7" />
          <path d="M18 21V7" />
          <path d="M4 7h16" />
          <path d="M5 4h14l1 3H4l1-3z" />
          <path d="M10 21V7" />
          <path d="M14 21V7" />
          <path d="M12 11l-1 2 2 2-1 2" />
        </svg>
      )

    // Social Wellbeing — heart + pulse
    case 'wellbeing':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M12 20s-7-5.75-7-10.25A4.5 4.5 0 0112 6.5a4.5 4.5 0 017 3.25c0 4.5-7 10.25-7 10.25z" />
          <path d="M5 13h3l2-3 2 5 2-3 2 1h3" />
        </svg>
      )

    // Policy Response — document with seal
    case 'policy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h4" />
          <circle cx="12" cy="15" r="0" />
        </svg>
      )

    // Public Sentiment — speech bubbles / signal waves
    case 'sentiment':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M12 20h0a8 8 0 01-8-8h0a8 8 0 018-8h0a8 8 0 018 8h0a8 8 0 01-8 8z" />
          <path d="M12 16v-4M12 8h.01" />
          <path d="M8 12a4 4 0 018 0" />
          <path d="M6 10a6 6 0 0112 0" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" style={s}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l2 2" />
        </svg>
      )
  }
}
