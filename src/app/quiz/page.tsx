'use client'

import { QuizForm } from '@/components/QuizForm'
import { useTheme } from '@/lib/theme'

export default function QuizPage() {
  const { theme } = useTheme()

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 16, fontFamily: theme.fontHeading }}>
            Your Exposure Assessment
          </h1>
          <p style={{ fontSize: 16, color: theme.textSecondary, fontFamily: theme.fontBody, lineHeight: 1.6 }}>
            Understand how exposed your job and skills are to AI displacement
          </p>
        </div>
        <QuizForm />
      </div>
    </div>
  )
}
