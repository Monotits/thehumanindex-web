'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme'

const SOCIAL_LINKS = [
  {
    name: 'X (Twitter)',
    handle: '@thehumanindex',
    url: 'https://x.com/thehumanindex',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@thehumanindex',
    url: 'https://instagram.com/thehumanindex',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@thehumanindex',
    url: 'https://tiktok.com/@thehumanindex',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16v-3.44a4.85 4.85 0 01-3.59-1.44V6.69h3.59z" />
      </svg>
    ),
  },
]

type FormStatus = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactPage() {
  const { theme, themeId } = useTheme()
  const isBriefing = themeId === 'briefing'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (res.ok) {
        setStatus('sent')
        setName(''); setEmail(''); setSubject(''); setMessage('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: themeId === 'terminal' ? 4 : 8,
    color: theme.text,
    fontSize: 14,
    fontFamily: theme.fontBody,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ background: isBriefing ? '#f8f5f0' : theme.bg, minHeight: '100vh', color: theme.text }}>
      {/* Hero */}
      <div style={{ borderBottom: `1px solid ${theme.surfaceBorder}`, padding: '56px 24px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontFamily: theme.fontMono }}>
            Contact
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.text, fontFamily: theme.fontHeading, lineHeight: 1.2, margin: '0 0 14px' }}>
            Get in Touch
          </h1>
          <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.6, fontFamily: theme.fontBody }}>
            Questions about the index, partnership inquiries, press requests, or just want to say hello — we&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 64px' }}>
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

          {/* Left: Contact Form */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: '0 0 20px', fontFamily: theme.fontHeading }}>
              Send a Message
            </h2>

            {status === 'sent' ? (
              <div style={{
                background: `${theme.accent}10`,
                border: `1px solid ${theme.accent}30`,
                borderRadius: 10,
                padding: 32,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 8, fontFamily: theme.fontHeading }}>
                  Message sent
                </div>
                <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0, fontFamily: theme.fontBody }}>
                  We&apos;ll get back to you as soon as we can. Usually within 48 hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  style={{ marginTop: 16, padding: '8px 20px', background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, color: theme.text, fontSize: 13, cursor: 'pointer', fontFamily: theme.fontBody }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6, fontFamily: theme.fontBody }}>Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6, fontFamily: theme.fontBody }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6, fontFamily: theme.fontBody }}>Subject</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' as const }}
                  >
                    <option value="">Select a topic...</option>
                    <option value="general">General Inquiry</option>
                    <option value="press">Press & Media</option>
                    <option value="research">Research Collaboration</option>
                    <option value="data">Data & API Access</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6, fontFamily: theme.fontBody }}>Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="What's on your mind?"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    padding: '12px 0',
                    background: theme.accent,
                    border: 'none',
                    borderRadius: themeId === 'terminal' ? 4 : 8,
                    color: theme.isDark ? '#000' : '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: status === 'sending' ? 'wait' : 'pointer',
                    fontFamily: theme.fontBody,
                    opacity: status === 'sending' ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                {status === 'error' && (
                  <p style={{ fontSize: 13, color: '#ef4444', margin: 0, fontFamily: theme.fontBody }}>
                    Something went wrong. Please try again or reach out on social media.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Right: Social + Info */}
          <div>
            {/* Social Media */}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: '0 0 20px', fontFamily: theme.fontHeading }}>
              Follow the Index
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {SOCIAL_LINKS.map(social => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: theme.surface,
                    border: `1px solid ${theme.surfaceBorder}`,
                    borderRadius: themeId === 'terminal' ? 4 : 10,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {social.icon(theme.text)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, fontFamily: theme.fontBody }}>{social.name}</div>
                    <div style={{ fontSize: 12, color: theme.textTertiary, fontFamily: theme.fontMono }}>{social.handle}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto' }}>
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </a>
              ))}
            </div>

            {/* Response time */}
            <div style={{
              background: `${theme.accent}08`,
              border: `1px solid ${theme.accent}20`,
              borderRadius: themeId === 'terminal' ? 4 : 10,
              padding: '20px 20px',
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6, fontFamily: theme.fontBody }}>
                Response Time
              </div>
              <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.6, fontFamily: theme.fontBody }}>
                We typically respond within 48 hours. For urgent press inquiries, DM us on X for a faster response.
              </p>
            </div>

            {/* Quick links */}
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: themeId === 'terminal' ? 4 : 10,
              padding: '20px 20px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 12, fontFamily: theme.fontBody }}>
                Quick Links
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Read our methodology', href: '/methodology' },
                  { label: 'Browse the weekly Pulse', href: '/pulse' },
                  { label: 'Take the AI exposure quiz', href: '/quiz' },
                  { label: 'Subscribe to weekly updates', href: '/' },
                ].map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{ fontSize: 13, color: theme.accent, textDecoration: 'none', fontFamily: theme.fontBody }}
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
