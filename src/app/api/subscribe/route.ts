import { supabase } from '@/lib/supabase'
import { getPostHogClient } from '@/lib/posthog-server'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

// In-memory rate limiter
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

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''

    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Try Supabase first
    try {
      const { error } = await supabase
        .from('subscribers')
        .upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: 'email' })

      if (error) throw error
    } catch {
      // If Supabase table doesn't exist yet, that's OK — we still accept the subscription
      console.log('Supabase subscribers table not available')
    }

    const posthog = getPostHogClient()
    posthog.identify({ distinctId: email, properties: { email } })
    posthog.capture({
      distinctId: email,
      event: 'newsletter_subscription_created',
      properties: { email },
    })
    await posthog.shutdown()

    return Response.json({ success: true, message: 'Subscribed successfully' })
  } catch {
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
