'use client'

import { useTheme } from '@/lib/theme'

interface Props {
  title: string
  children: React.ReactNode
}

export default function ChartInsight({ title, children }: Props) {
  const { theme } = useTheme()

  return (
    <div style={{
      marginTop: 16,
      padding: '14px 18px',
      background: theme.isDark ? `${theme.accent}08` : `${theme.accent}06`,
      border: `1px solid ${theme.isDark ? theme.accent + '18' : theme.accent + '15'}`,
      borderLeft: `3px solid ${theme.accent}40`,
      borderRadius: 6,
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: theme.accent,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
        fontFamily: theme.fontBody,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 1.65,
        fontFamily: theme.fontBody,
      }}>
        {children}
      </div>
    </div>
  )
}
