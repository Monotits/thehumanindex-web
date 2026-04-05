/**
 * Design System Tokens — The Human Index
 *
 * Single source of truth for typography, spacing, layout, and component styles.
 * All pages MUST use these tokens instead of hardcoded values.
 */

// ── Typography Scale ──────────────────────────────
export const TYPE = {
  // Headings
  h1: { fontSize: 32, fontWeight: 300, lineHeight: 1.2 },
  h2: { fontSize: 24, fontWeight: 400, lineHeight: 1.3 },
  h3: { fontSize: 18, fontWeight: 600, lineHeight: 1.3 },
  h4: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 },

  // Body
  body: { fontSize: 15, fontWeight: 400, lineHeight: 1.7 },
  bodyLarge: { fontSize: 16, fontWeight: 400, lineHeight: 1.7 },
  bodySmall: { fontSize: 13, fontWeight: 400, lineHeight: 1.6 },

  // UI Elements
  label: { fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const },
  caption: { fontSize: 11, fontWeight: 400, lineHeight: 1.4 },
  stat: { fontSize: 22, fontWeight: 600, lineHeight: 1 },
  statLarge: { fontSize: 48, fontWeight: 200, lineHeight: 1 },
  mono: { fontSize: 13, fontWeight: 500 },
} as const

// ── Spacing Scale (4px base) ──────────────────────
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const

// ── Layout ────────────────────────────────────────
export const LAYOUT = {
  maxWidth: 1100,              // All pages
  maxWidthNarrow: 800,         // Article/reading pages (pulse detail, glossary detail)
  pagePadding: '0 24px',
  pageTopPadding: 48,
  sectionGap: 24,              // Between major sections
  cardGap: 16,                 // Between cards in a grid
  gridColumns2: 'repeat(2, 1fr)',
  gridColumns3: 'repeat(3, 1fr)',
} as const

// ── Component Tokens ──────────────────────────────
export const CARD = {
  borderRadius: 10,
  padding: 24,
  paddingCompact: 16,
} as const

export const BADGE = {
  borderRadius: 6,
  padding: '4px 14px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 2,
} as const

// ── Band Colors (severity scale, theme-independent) ──
export const BAND_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  elevated: '#f59e0b',
  moderate: '#3b82f6',
  low: '#22c55e',
}

export function getScoreColor(score: number): string {
  if (score >= 70) return BAND_COLORS.critical
  if (score >= 55) return BAND_COLORS.high
  if (score >= 40) return BAND_COLORS.elevated
  if (score >= 25) return BAND_COLORS.moderate
  return BAND_COLORS.low
}

export function getBandColor(band: string): string {
  return BAND_COLORS[band] || '#888'
}

// ── Helpers for inline styles ─────────────────────
export function pageContainer(maxWidth = LAYOUT.maxWidth) {
  return {
    maxWidth,
    margin: '0 auto',
    padding: LAYOUT.pagePadding,
  } as const
}

export function sectionStyle() {
  return {
    marginBottom: LAYOUT.sectionGap,
  } as const
}

export function cardStyle(theme: { surface: string; surfaceBorder: string }) {
  return {
    background: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
  } as const
}

export function labelStyle(theme: { textTertiary: string }) {
  return {
    fontSize: TYPE.label.fontSize,
    fontWeight: TYPE.label.fontWeight,
    letterSpacing: TYPE.label.letterSpacing,
    textTransform: TYPE.label.textTransform,
    color: theme.textTertiary,
  } as const
}
