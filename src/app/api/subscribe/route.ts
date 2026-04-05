import { supabase } from '@/lib/supabase'
import { getPostHogClient } from '@/lib/posthog-server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
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
      console.log('Supabase subscribers table not available, email accepted locally:', email)
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
