-- Migration 025 — subscribers table hardening for production newsletter
--
-- Before this migration, /api/subscribe upserted (email, subscribed_at)
-- into a loose subscribers table. There was no way to unsubscribe (no
-- token), no way to track which subscribers received which brief, and
-- no soft-delete semantics. This migration brings the table to a state
-- where the weekly brief cron can safely query 'active' subscribers
-- and the unsubscribe endpoint can flip a single subscriber off
-- without deleting the audit trail.

CREATE TABLE IF NOT EXISTS subscribers (
  email           text PRIMARY KEY,
  subscribed_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscribers
  -- Token for the unsubscribe link in every email. Generated client-side
  -- on signup (crypto.randomUUID()) so even the DB never sees it raw via
  -- service_role logs; it's used as a lookup key only.
  ADD COLUMN IF NOT EXISTS unsubscribe_token text,
  -- Soft-delete timestamp. NULL => active subscriber.
  ADD COLUMN IF NOT EXISTS unsubscribed_at  timestamptz,
  -- Most recent weekly brief send. Lets the cron skip already-sent
  -- subscribers within the same dispatch window.
  ADD COLUMN IF NOT EXISTS last_brief_sent_at timestamptz,
  -- Optional opt-in confirmation slot (kept dormant for future
  -- double-opt-in if needed; not used by current single-opt-in flow).
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  -- Where they signed up from (analytics enrichment).
  ADD COLUMN IF NOT EXISTS source text;

-- Backfill tokens for any existing rows from before this migration.
UPDATE subscribers
   SET unsubscribe_token = COALESCE(unsubscribe_token, gen_random_uuid()::text)
 WHERE unsubscribe_token IS NULL;

-- Tighten constraints
ALTER TABLE subscribers
  ALTER COLUMN unsubscribe_token SET NOT NULL;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_token
  ON subscribers(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_subscribers_active
  ON subscribers(unsubscribed_at)
  WHERE unsubscribed_at IS NULL;

-- Delivery audit log — one row per (subscriber, dispatch).
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_email text NOT NULL REFERENCES subscribers(email) ON DELETE CASCADE,
  -- ISO week key the brief is for (e.g. '2026-W23'). Makes 'who got
  -- which week's brief' a simple equality lookup.
  week_key        text NOT NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL CHECK (status IN ('sent','bounced','failed')),
  resend_id       text,        -- Resend message id for tracing in dashboard
  error_message   text,        -- populated when status != 'sent'
  meta            jsonb        -- arbitrary per-send context
);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_week
  ON newsletter_sends(week_key);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber
  ON newsletter_sends(subscriber_email, sent_at DESC);

-- RLS — write only via service role, read closed to public.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

-- No public policies. Service role bypasses RLS — only the API routes
-- (which use the service role key from env) can read/write.

GRANT SELECT, INSERT, UPDATE ON subscribers TO service_role;
GRANT SELECT, INSERT ON newsletter_sends TO service_role;
