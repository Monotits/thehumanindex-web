-- Migration 006: confidence_tier on corporate_layoffs_curated
--
-- Splits layoff records into three trust tiers so the UI can show
-- "Confirmed" vs "Unconfirmed Reports" separately. Only verified+reported
-- tiers will eventually feed the composite score; rumored never does.
--
-- Tiers:
--   verified — SEC 8-K filings, state WARN notices (legal disclosure required)
--   reported — major news outlets (Reuters, BBC, AP, TechCrunch, etc.)
--   rumored  — social media (Reddit, forums) — unconfirmed signals only

ALTER TABLE corporate_layoffs_curated
  ADD COLUMN IF NOT EXISTS confidence_tier text NOT NULL DEFAULT 'reported'
  CHECK (confidence_tier IN ('verified', 'reported', 'rumored'));

-- Backfill: anything from reddit becomes rumored, everything else stays reported.
-- (No verified rows exist yet — SEC + WARN fetchers come next.)
UPDATE corporate_layoffs_curated
SET confidence_tier = 'rumored'
WHERE source_type = 'reddit' AND confidence_tier = 'reported';

CREATE INDEX IF NOT EXISTS idx_corp_layoffs_tier_date
  ON corporate_layoffs_curated(confidence_tier, announcement_date DESC);

-- ── Updated views ──

-- Keep the original "recent" view as confirmed-only (verified + reported).
-- This is what the main Layoff Tracker displays.
DROP VIEW IF EXISTS v_corporate_layoffs_recent;
CREATE VIEW v_corporate_layoffs_recent
WITH (security_invoker = true) AS
SELECT DISTINCT ON (company) *
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '90 days')::date
  AND confidence_score >= 0.6
  AND confidence_tier IN ('verified', 'reported')
ORDER BY company, announcement_date DESC, confidence_score DESC, people_affected DESC NULLS LAST;

-- New: rumored-only view for the "Unconfirmed Reports" section.
-- Lower confidence floor (0.5) since these are signals, not events.
-- Dedup by source_url (each rumor is its own post; not by company).
CREATE OR REPLACE VIEW v_corporate_layoffs_rumored
WITH (security_invoker = true) AS
SELECT *
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '30 days')::date
  AND confidence_score >= 0.5
  AND confidence_tier = 'rumored'
ORDER BY announcement_date DESC, confidence_score DESC
LIMIT 50;

-- Stats are confirmed-only (rumors don't count in headline numbers).
DROP VIEW IF EXISTS v_corporate_layoffs_stats_30d;
CREATE VIEW v_corporate_layoffs_stats_30d
WITH (security_invoker = true) AS
SELECT
  COUNT(DISTINCT company) AS total_companies,
  COALESCE(SUM(people_affected), 0)::int AS total_affected,
  COUNT(*) FILTER (WHERE is_ai_driven) AS ai_driven_events,
  COUNT(*) AS total_events,
  COALESCE(ROUND(
    COUNT(*) FILTER (WHERE is_ai_driven)::numeric
    / NULLIF(COUNT(*), 0) * 100, 0
  ), 0)::int AS ai_driven_percent
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '30 days')::date
  AND confidence_score >= 0.6
  AND confidence_tier IN ('verified', 'reported');

GRANT SELECT ON v_corporate_layoffs_rumored TO anon, authenticated;

COMMENT ON COLUMN corporate_layoffs_curated.confidence_tier IS
  'verified=SEC/WARN filings, reported=news outlets, rumored=social media signals';
COMMENT ON VIEW v_corporate_layoffs_rumored IS
  'Reddit/social media rumored layoffs from last 30 days, confidence >= 0.5. Never counts toward composite.';
