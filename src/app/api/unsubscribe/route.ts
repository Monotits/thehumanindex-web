import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/unsubscribe?token=...
 *
 * Single-click unsubscribe. The token comes from the email footer.
 * On success we redirect to /unsubscribed which renders a confirmation
 * page so the user knows their action worked.
 *
 * Also supports POST for RFC 8058 'List-Unsubscribe-Post' one-click
 * unsubscribe — major mailbox providers (Gmail, Outlook) call POST
 * directly without a browser.
 */

const BASE_URL = 'https://thehumanindex.org'

async function processUnsubscribe(token: string): Promise<{ ok: boolean; email?: string }> {
  if (!token || typeof token !== 'string' || token.length < 8) {
    return { ok: false }
  }

  try {
    if (!supabaseAdmin) {
      console.error('[unsubscribe] SUPABASE_SERVICE_ROLE_KEY missing')
      return { ok: false }
    }
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('unsubscribe_token', token)
      .select('email')
      .maybeSingle()

    if (error) {
      console.error('[unsubscribe] supabase error:', error)
      return { ok: false }
    }
    if (!data) return { ok: false }
    return { ok: true, email: data.email as string }
  } catch (err) {
    console.error('[unsubscribe] unexpected:', err)
    return { ok: false }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') ?? ''
  const result = await processUnsubscribe(token)

  // Redirect to public confirmation page.
  const dest = result.ok
    ? `${BASE_URL}/unsubscribed?ok=1`
    : `${BASE_URL}/unsubscribed?ok=0`
  return Response.redirect(dest, 302)
}

export async function POST(request: Request) {
  // RFC 8058 one-click unsubscribe. Body is form-urlencoded.
  let token = ''
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    token = params.get('token') ?? new URL(request.url).searchParams.get('token') ?? ''
  } catch {
    token = new URL(request.url).searchParams.get('token') ?? ''
  }

  const result = await processUnsubscribe(token)
  return Response.json({ ok: result.ok })
}
