export const dynamic = 'force-dynamic'

// Simple HTML escaping to prevent injection
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Basic email format check
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

// In-memory rate limiter (resets on cold start, good enough for Vercel serverless)
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5       // max requests
const RATE_WINDOW = 3600000 // per hour (ms)

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 50) : ''
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : ''

    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      press: 'Press & Media',
      research: 'Research Collaboration',
      data: 'Data & API Access',
      feedback: 'Feedback & Suggestions',
      bug: 'Bug Report',
    }

    const subjectLabel = subjectLabels[subject] || 'General'

    // Escape all user inputs before HTML interpolation
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeMessage = escapeHtml(message)

    // Send email via Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL || 'experlercom@gmail.com'

      // Custom domain verified → use branded sender; falls back to Resend default
      const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'The Human Index <onboarding@resend.dev>'
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `[THI Contact] ${subjectLabel} — from ${safeName}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #111;">New Contact Message</h2>
              <p style="margin: 4px 0 0; color: #666; font-size: 14px;">The Human Index — Contact Form</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr><td style="padding: 8px 0; color: #999; font-size: 13px; width: 100px;">From</td><td style="padding: 8px 0; font-size: 14px;"><strong>${safeName}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-size: 14px;">${escapeHtml(subjectLabel)}</td></tr>
            </table>
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap;">${safeMessage}</p>
            </div>
            <p style="font-size: 12px; color: #999;">Reply directly to this email to respond to ${safeName}.</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Resend email failed:', emailError)
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
