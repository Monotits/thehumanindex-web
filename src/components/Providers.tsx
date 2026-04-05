'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { initAnalytics } from '@/lib/analytics'
import ThemeSelector from './ThemeSelector'

function ThemeGate({ children }: { children: ReactNode }) {
  const { hasChosenTheme, setHasChosenTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Short delay to allow theme to apply before showing content (prevents flash)
    const timer = setTimeout(() => setReady(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null // Don't render anything server-side to avoid mismatch

  // Show theme selector modal if user hasn't chosen a theme yet
  if (!hasChosenTheme) {
    return (
      <ThemeSelector isModal onClose={() => setHasChosenTheme(true)} />
    )
  }

  return (
    <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.15s ease-in' }}>
      {children}
    </div>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { initAnalytics() }, [])

  return (
    <ThemeProvider>
      <ThemeGate>{children}</ThemeGate>
    </ThemeProvider>
  )
}
