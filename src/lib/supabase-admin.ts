import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for server-only writes.
 *
 * Use this in API routes that need to write to tables with RLS
 * enabled and no public policy (subscribers, newsletter_sends, etc.).
 * The service role key bypasses RLS — never import this from client
 * code or expose its key.
 *
 * Falls back to NULL if the env var is missing, so callers can
 * handle 'no service key' gracefully (e.g. in local dev).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null
