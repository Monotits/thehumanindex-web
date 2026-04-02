/**
 * Share Card Visual Styles
 *
 * Three distinct visual themes for share cards:
 * - terminal: Bloomberg-inspired, dark bg, neon accents, monospace
 * - gradient: Modern dark gradient, glassmorphism, vibrant colors
 * - minimal: Clean white, editorial typography, professional
 */

export type CardStyle = 'terminal' | 'gradient' | 'minimal'
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
  // Fonts
  fontBody: string
  fontMono: string
  fontHeading: string
  // Score colors (same across all)
  scoreColors: {
    low: string
    moderate: string
    elevated: string
    high: string
    critical: string
  }
}

export const CARD_THEMES: Record<CardStyle, CardTheme> = {
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    description: 'Bloomberg-inspired dark terminal',
    bg: '#0a0a0a',
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #0f1419 50%, #0a0a0a 100%)',
    cardBg: 'rgba(17, 17, 17, 0.9)',
    cardBorder: '#1a2a1a',
    text: '#e0e0e0',
    textSecondary: '#999999',
    textMuted: '#555555',
    accent: '#00ff88',
    fontBody: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', 'SF Mono', monospace",
    fontHeading: "'Inter', sans-serif",
    scoreColors: {
      low: '#22c55e',
      moderate: '#3b82f6',
      elevated: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    },
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient',
    description: 'Modern dark gradient',
    bg: '#0f0f1a',
    bgGradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 30%, #0a1628 70%, #0f0f1a 100%)',
    cardBg: 'rgba(255, 255, 255, 0.06)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textSecondary: '#a0a0b0',
    textMuted: '#606070',
    accent: '#a78bfa',
    fontBody: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    fontHeading: "'Inter', sans-serif",
    scoreColors: {
      low: '#34d399',
      moderate: '#60a5fa',
      elevated: '#fbbf24',
      high: '#fb923c',
      critical: '#f87171',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean white, professional',
    bg: '#ffffff',
    bgGradient: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #fafafa 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e5e5e5',
    text: '#111111',
    textSecondary: '#555555',
    textMuted: '#999999',
    accent: '#111111',
    fontBody: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    fontHeading: "'Georgia', 'Times New Roman', serif",
    scoreColors: {
      low: '#16a34a',
      moderate: '#2563eb',
      elevated: '#d97706',
      high: '#ea580c',
      critical: '#dc2626',
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
