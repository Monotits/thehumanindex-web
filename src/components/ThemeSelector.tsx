'use client'

import { useTheme, THEMES, ThemeId } from '@/lib/theme'
import { trackFirstVisitTheme } from '@/lib/analytics'

interface Props {
  isModal?: boolean
  onClose?: () => void
}

const THEME_PREVIEWS: Record<ThemeId, { emoji: string; colors: string[] }> = {
  terminal: { emoji: '📟', colors: ['#0a0a0a', '#00ff88', '#111111'] },
  briefing: { emoji: '📰', colors: ['#fafaf8', '#c41e1e', '#1a2332'] },
  signal: { emoji: '📡', colors: ['#0a0a0a', '#f59e0b', '#111111'] },
}

export default function ThemeSelector({ isModal, onClose }: Props) {
  const { themeId, setTheme, setHasChosenTheme } = useTheme()

  const handleSelect = (id: ThemeId) => {
    setTheme(id)
    if (isModal) {
      setHasChosenTheme(true)
      trackFirstVisitTheme(id)
      onClose?.()
    }
  }

  const content = (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {isModal && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>Choose Your View</h2>
          <p style={{ fontSize: 14, color: '#888' }}>Pick the experience that fits how you want to explore the data. You can change this anytime in settings.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {(Object.keys(THEMES) as ThemeId[]).map(id => {
          const t = THEMES[id]
          const preview = THEME_PREVIEWS[id]
          const isActive = themeId === id
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              style={{
                padding: 0,
                border: isActive ? '2px solid #fff' : '2px solid #222',
                borderRadius: 10,
                background: '#111',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Color preview strip */}
              <div style={{ height: 48, display: 'flex' }}>
                {preview.colors.map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c }} />
                ))}
              </div>
              <div style={{ padding: '16px 16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{preview.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{t.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{t.tagline}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{t.description}</div>
                {isActive && (
                  <div style={{ marginTop: 10, fontSize: 11, color: '#00ff88', fontWeight: 600 }}>✓ Active</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 760, width: '100%', padding: 32 }}>
          {content}
        </div>
      </div>
    )
  }

  return content
}
