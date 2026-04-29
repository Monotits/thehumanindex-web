-- Migration 003: social_feed_curated
-- Stores LLM-enriched social feed items. Populated by PD dashboard
-- (server/modules/social-feed/) which fetches raw items from Reddit/news,
-- scores each via Claude CLI for relevance + summary, then upserts here.
-- thehumanindex-web /api/social-feed reads from this table for display.

CREATE TABLE IF NOT EXISTS social_feed_curated (
  id text PRIMARY KEY,                            -- e.g. 'reddit-abc123' (idempotent upsert key)
  source text NOT NULL,                           -- 'reddit' | 'news' | 'x'
  source_name text NOT NULL,                      -- 'r/economics', 'Reuters', etc.
  source_icon text,                               -- emoji or identifier
  title text NOT NULL,
  body text DEFAULT '',
  url text NOT NULL,
  author text,
  raw_score integer NOT NULL DEFAULT 0,           -- upvotes / underlying engagement
  relevance_score numeric(3,1),                   -- 0.0 - 10.0 from Claude
  why_matters text,                               -- 1-sentence editorial summary from Claude
  domain_tags text[] DEFAULT '{}',                -- which THI domains this relates to
  published_at timestamptz NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  enriched_at timestamptz,                        -- when Claude scored it; NULL if pending
  enrichment_model text                           -- 'claude-sonnet-4', 'claude-haiku-4-5', etc.
);

CREATE INDEX IF NOT EXISTS idx_social_feed_curated_relevance
  ON social_feed_curated(relevance_score DESC NULLS LAST, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_feed_curated_published
  ON social_feed_curated(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_feed_curated_source
  ON social_feed_curated(source, published_at DESC);

-- View: top-N most relevant items in last 7 days (used by /api/social-feed)
CREATE OR REPLACE VIEW v_social_feed_recent AS
SELECT *
FROM social_feed_curated
WHERE published_at >= now() - interval '7 days'
  AND (relevance_score IS NULL OR relevance_score >= 4.0)  -- filter junk; NULL = not yet enriched, still show
ORDER BY relevance_score DESC NULLS LAST, published_at DESC
LIMIT 50;

ALTER TABLE social_feed_curated ENABLE ROW LEVEL SECURITY;

-- Public read (this is consumer-facing content)
CREATE POLICY "Public read social_feed_curated"
  ON social_feed_curated FOR SELECT USING (true);

-- Service role writes only (PD dashboard uses SUPABASE_SERVICE_ROLE_KEY)

COMMENT ON TABLE social_feed_curated IS 'LLM-enriched social feed items. Populated by PD dashboard, read by thehumanindex-web.';
COMMENT ON VIEW v_social_feed_recent IS 'Top-relevance items from last 7 days. Read this for consumer display.';
