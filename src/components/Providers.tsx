'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { initAnalytics } from '@/lib/analytics'
import ThemeSelector from './ThemeSelector'

function ThemeGate({ children }: { children: ReactNode }) {
  const { hasChosenTheme, setHasChosenTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <>{children}</>

  if (!hasChosenTheme) {
    return (
      <ThemeSelector isModal onClose={() => setHasChosenTheme(true)} />
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { initAnalytics() }, [])

  return (
    <ThemeProvider>
      <ThemeGate>{children}</ThemeGate>
    </ThemeProvider>
  )
}
