'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { trackThemeChange } from './analytics'

export type ThemeId = 'terminal' | 'briefing' | 'signal'

export interface ThemeConfig {
  id: ThemeId
  name: string
  tagline: string
  description: string
  persona: string
  // Colors
  bg: string
  surface: string
  surfaceBorder: string
  accent: string
  accentHover: string
  text: string
  textSecondary: string
  textTertiary: string
  // Typography
  fontBody: string
  fontMono: string
  fontHeading: string
  // Mode
  isDark: boolean
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    tagline: 'Data-dense, real-time',
    description: 'Bloomberg-inspired terminal view with maximum data density. Built for analysts and quants.',
    persona: 'Macro Strategist',
    bg: '#0a0a0a',
    surface: '#111111',
    surfaceBorder: '#1a1a1a',
    accent: '#00ff88',
    accentHover: '#00cc6a',
    text: '#e0e0e0',
    textSecondary: '#999999',
    textTertiary: '#666666',
    fontBody: "'Inter', -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', 'SF Mono', 'Geist Mono', monospace",
    fontHeading: "'Inter', -apple-system, sans-serif",
    isDark: true,
  },
  briefing: {
    id: 'briefing',
    name: 'Briefing',
    tagline: 'Editorial, authoritative',
    description: 'The Economist meets Foreign Affairs. Clean editorial design for policy professionals.',
    persona: 'Policy Architect',
    bg: '#fafaf8',
    surface: '#ffffff',
    surfaceBorder: '#e5e2dc',
    accent: '#c41e1e',
    accentHover: '#a31818',
    text: '#1a1a1a',
    textSecondary: '#555555',
    textTertiary: '#888888',
    fontBody: "'Inter', -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    fontHeading: "'Georgia', 'Times New Roman', serif",
    isDark: false,
  },
  signal: {
    id: 'signal',
    name: 'Signal',
    tagline: 'Minimal, impactful',
    description: 'Clean and immediate. One glance tells you the state of the world.',
    persona: 'Everyone',
    bg: '#0a0a0a',
    surface: '#111111',
    surfaceBorder: '#1a1a1a',
    accent: '#f59e0b',
    accentHover: '#d97706',
    text: '#e0e0e0',
    textSecondary: '#888888',
    textTertiary: '#555555',
    fontBody: "'Inter', -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    fontHeading: "'Inter', -apple-system, sans-serif",
    isDark: true,
  },
}

interface ThemeContextType {
  theme: ThemeConfig
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
  hasChosenTheme: boolean
  setHasChosenTheme: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES.signal,
  themeId: 'signal',
  setTheme: () => {},
  hasChosenTheme: false,
  setHasChosenTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('signal')
  const [hasChosenTheme, setHasChosenTheme] = useState(true) // default true to avoid flash
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('thi-theme') as ThemeId | null
    const hasChosen = localStorage.getItem('thi-theme-chosen')
    if (saved && THEMES[saved]) {
      setThemeId(saved)
    }
    setHasChosenTheme(hasChosen === 'true')
  }, [])

  const setTheme = (id: ThemeId) => {
    setThemeId(id)
    localStorage.setItem('thi-theme', id)
    trackThemeChange(id)
  }

  const theme = THEMES[themeId]

  // Apply CSS variables to document
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.style.setProperty('--thi-bg', theme.bg)
    root.style.setProperty('--thi-surface', theme.surface)
    root.style.setProperty('--thi-surface-border', theme.surfaceBorder)
    root.style.setProperty('--thi-accent', theme.accent)
    root.style.setProperty('--thi-text', theme.text)
    root.style.setProperty('--thi-text-secondary', theme.textSecondary)
    root.style.setProperty('--thi-text-tertiary', theme.textTertiary)
    root.style.setProperty('--thi-font-body', theme.fontBody)
    root.style.setProperty('--thi-font-mono', theme.fontMono)
    root.style.setProperty('--thi-font-heading', theme.fontHeading)
    document.body.style.background = theme.bg
    document.body.style.color = theme.text
  }, [theme, mounted])

  return (
    <ThemeContext.Provider value={{
      theme,
      themeId,
      setTheme,
      hasChosenTheme,
      setHasChosenTheme: (v: boolean) => {
        setHasChosenTheme(v)
        localStorage.setItem('thi-theme-chosen', String(v))
      },
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
