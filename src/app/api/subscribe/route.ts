import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPostHogClient } from '@/lib/posthog-server'
import { welcomeEmail } from '@/lib/email-templates'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

// In-memory rate limiter — 10 attempts per IP per hour.
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 3600000

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

const BASE_URL = 'https://thehumanindex.org'
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL || 'The Human Index <onboarding@resend.dev>'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254).toLowerCase() : ''
    const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null

    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Generate (or reuse) an unsubscribe token. crypto.randomUUID is available
    // in the Edge runtime.
    const unsubscribeToken = crypto.randomUUID()

    // Upsert. If the email already exists, keep its existing token so
    // resending welcome emails on resubscribe doesn't invalidate old
    // unsubscribe links in earlier issues.
    let storedToken = unsubscribeToken
    if (!supabaseAdmin) {
      console.error('[subscribe] SUPABASE_SERVICE_ROLE_KEY missing — cannot persist subscriber')
    }
    try {
      if (!supabaseAdmin) throw new Error('Missing service role key')
      // First, look up an existing row so we can preserve its token.
      const { data: existing } = await supabaseAdmin!
        .from('subscribers')
        .select('email, unsubscribe_token, unsubscribed_at')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        storedToken = existing.unsubscribe_token as string
        // If they had unsubscribed, re-activate the row.
        if (existing.unsubscribed_at) {
          await supabaseAdmin!
            .from('subscribers')
            .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString(), source })
            .eq('email', email)
        }
      } else {
        const { error } = await supabaseAdmin!
          .from('subscribers')
          .insert({
            email,
            unsubscribe_token: unsubscribeToken,
            subscribed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(), // single-opt-in
            source,
          })
        if (error) throw error
      }
    } catch (dbErr) {
      // Don't fail the user-facing request on a DB hiccup — they'll still
      // see 'subscribed', just won't get a welcome email this time.
      console.error('[subscribe] supabase error:', dbErr)
    }

    // Send the welcome email via Resend. We have a verified domain (used
    // by /api/contact). The unsubscribe URL is the same shape as every
    // future weekly brief, so users get a consistent flow.
    const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${storedToken}`
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const tpl = welcomeEmail(unsubscribeUrl)
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
    } catch (emailErr) {
      // Email failure doesn't fail the subscribe — the row is in DB,
      // and the next weekly brief will still go out. Log + carry on.
      console.error('[subscribe] resend error:', emailErr)
    }

    // PostHog
    try {
      const posthog = getPostHogClient()
      posthog.identify({ distinctId: email, properties: { email, source } })
      posthog.capture({
        distinctId: email,
        event: 'newsletter_subscription_created',
        properties: { email, source },
      })
      await posthog.shutdown()
    } catch {
      /* ignore */
    }

    return Response.json({ success: true, message: 'Subscribed successfully' })
  } catch {
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
