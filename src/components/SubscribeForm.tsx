'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme'

export default function SubscribeForm({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ padding: variant === 'compact' ? '8px 0' : '12px 0', color: theme.accent, fontSize: 14, fontWeight: 600, fontFamily: theme.fontBody }}>
        You&apos;re in. Watch your inbox for the next Pulse.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{
          flex: 1,
          minWidth: 180,
          padding: '10px 14px',
          background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 6,
          color: theme.text,
          fontSize: 13,
          fontFamily: theme.fontBody,
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '10px 20px',
          background: theme.accent,
          border: 'none',
          borderRadius: 6,
          color: theme.isDark ? '#000' : '#fff',
          fontWeight: 600,
          fontSize: 13,
          cursor: status === 'loading' ? 'wait' : 'pointer',
          fontFamily: theme.fontBody,
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <div style={{ width: '100%', fontSize: 12, color: '#ef4444', fontFamily: theme.fontBody }}>
          Something went wrong. Please try again.
        </div>
      )}
    </form>
  )
}
