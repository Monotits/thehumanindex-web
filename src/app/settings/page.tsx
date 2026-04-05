'use client'

import ThemeSelector from '@/components/ThemeSelector'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const { theme } = useTheme()

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.text, marginBottom: 8, fontFamily: theme.fontHeading }}>Settings</h1>
        <p style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 40, fontFamily: theme.fontBody }}>
          Customize your experience. More settings coming soon including language and regional data preferences.
        </p>

        {/* Theme Section */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 4, fontFamily: theme.fontHeading }}>Theme</h2>
          <p style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 20, fontFamily: theme.fontBody }}>Choose the visual style that best fits your workflow</p>
          <ThemeSelector />
        </div>

        {/* Placeholder for future settings */}
        <div style={{ borderTop: `1px solid ${theme.surfaceBorder}`, paddingTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 4, fontFamily: theme.fontHeading }}>Language & Region</h2>
          <p style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 16, fontFamily: theme.fontBody }}>Regional data and language preferences</p>
          <div style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 20 }}>
            <span style={{ fontSize: 13, color: theme.textTertiary }}>Coming soon — Country-specific analysis and multi-language support</span>
          </div>
        </div>
      </div>
    </div>
  )
}
