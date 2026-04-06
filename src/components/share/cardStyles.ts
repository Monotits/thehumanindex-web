/**
 * Share Card Visual Styles — "The Ethereal Command Center"
 *
 * Brand-aligned themes based on THE HUMAN INDEX design system:
 * - command: Midnight Navy + Cyber Cyan + Warning Amber (primary brand)
 * - signal: Dark variant with amber-dominant accent
 * - briefing: Light editorial variant for professional contexts
 *
 * Design principles:
 * - No opaque borders (tonal layering only)
 * - Cinematic depth via gradients
 * - Space Grotesk for headlines, Inter for body
 * - Warning Amber for critical data (surgical highlight)
 * - Cyber Cyan for data viz and interactive elements
 * - Max border-radius: 0.75rem (12px) — engineered, not bubbly
 */

export type CardStyle = 'command' | 'signal' | 'briefing'
export type CardOrientation = 'horizontal' | 'vertical'

export interface CardTheme {
  id: CardStyle
  name: string
  description: string
  // Backgrounds
  bg: string
  bgGradient: string
  cardBg: string
  cardBorder: string
  // Text
  text: string
  textSecondary: string
  textMuted: string
  accent: string
  accentSecondary: string
  // Fonts
  fontBody: string
  fontMono: string
  fontHeading: string
  // Brand
  isDark: boolean
  // Score colors
  scoreColors: {
    low: string
    moderate: string
    elevated: string
    high: string
    critical: string
  }
}

export const CARD_THEMES: Record<CardStyle, CardTheme> = {
  command: {
    id: 'command',
    name: 'Command',
    description: 'Ethereal Command Center',
    bg: '#0A192F',
    bgGradient: 'linear-gradient(160deg, #0A192F 0%, #0D2137 35%, #091520 65%, #0A192F 100%)',
    cardBg: 'rgba(13, 33, 55, 0.6)',
    cardBorder: 'rgba(0, 229, 255, 0.12)',
    text: '#E8EDF3',
    textSecondary: '#8BA4BE',
    textMuted: '#3D5A7A',
    accent: '#00E5FF',
    accentSecondary: '#FFB800',
    fontBody: "Inter, Helvetica, Arial, sans-serif",
    fontMono: "'Courier New', Courier, monospace",
    fontHeading: "'Space Grotesk', Helvetica, Arial, sans-serif",
    isDark: true,
    scoreColors: {
      low: '#22D68A',
      moderate: '#00E5FF',
      elevated: '#FFB800',
      high: '#FF8A3D',
      critical: '#FF4757',
    },
  },
  signal: {
    id: 'signal',
    name: 'Signal',
    description: 'Amber alert variant',
    bg: '#0A0E17',
    bgGradient: 'linear-gradient(160deg, #0A0E17 0%, #121A2B 35%, #0E1520 65%, #0A0E17 100%)',
    cardBg: 'rgba(18, 26, 43, 0.6)',
    cardBorder: 'rgba(255, 184, 0, 0.12)',
    text: '#E8EDF3',
    textSecondary: '#8B99AE',
    textMuted: '#3D4A5A',
    accent: '#FFB800',
    accentSecondary: '#00E5FF',
    fontBody: "Inter, Helvetica, Arial, sans-serif",
    fontMono: "'Courier New', Courier, monospace",
    fontHeading: "'Space Grotesk', Helvetica, Arial, sans-serif",
    isDark: true,
    scoreColors: {
      low: '#22D68A',
      moderate: '#00B4D8',
      elevated: '#FFB800',
      high: '#FF8A3D',
      critical: '#FF4757',
    },
  },
  briefing: {
    id: 'briefing',
    name: 'Briefing',
    description: 'Light editorial',
    bg: '#F5F6F8',
    bgGradient: 'linear-gradient(160deg, #F5F6F8 0%, #EBEEF2 50%, #F5F6F8 100%)',
    cardBg: 'rgba(255, 255, 255, 0.7)',
    cardBorder: 'rgba(10, 25, 47, 0.08)',
    text: '#0A192F',
    textSecondary: '#3D5A7A',
    textMuted: '#8BA4BE',
    accent: '#0A192F',
    accentSecondary: '#FFB800',
    fontBody: "Inter, Helvetica, Arial, sans-serif",
    fontMono: "'Courier New', Courier, monospace",
    fontHeading: "'Space Grotesk', Helvetica, Arial, sans-serif",
    isDark: false,
    scoreColors: {
      low: '#0D9F5F',
      moderate: '#0077B6',
      elevated: '#CC9200',
      high: '#D96C00',
      critical: '#CC2936',
    },
  },
}

export function getScoreColor(score: number, theme: CardTheme): string {
  if (score >= 81) return theme.scoreColors.critical
  if (score >= 66) return theme.scoreColors.high
  if (score >= 46) return theme.scoreColors.elevated
  if (score >= 26) return theme.scoreColors.moderate
  return theme.scoreColors.low
}

export function getScoreBand(score: number): string {
  if (score >= 81) return 'CRITICAL'
  if (score >= 66) return 'HIGH'
  if (score >= 46) return 'ELEVATED'
  if (score >= 26) return 'MODERATE'
  return 'LOW'
}
