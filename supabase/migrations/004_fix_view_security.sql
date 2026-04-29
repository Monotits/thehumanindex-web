-- Migration 004: View security & permissions
-- Postgres views default to security_definer (run as creator) and don't always
-- inherit table grants. Anon key cannot read them. Recreate with
-- security_invoker so RLS on underlying tables applies, then grant SELECT to
-- anon + authenticated explicitly.

-- ── data_source_health views ──
DROP VIEW IF EXISTS v_data_source_health_latest;
CREATE VIEW v_data_source_health_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (source) *
FROM data_source_health
ORDER BY source, recorded_at DESC;

DROP VIEW IF EXISTS v_data_source_uptime_30d;
CREATE VIEW v_data_source_uptime_30d
WITH (security_invoker = true) AS
SELECT
  source,
  COUNT(*) FILTER (WHERE status = 'ok')::float / NULLIF(COUNT(*), 0) AS uptime,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'ok') AS successful_runs,
  MAX(last_success_at) AS most_recent_success
FROM data_source_health
WHERE recorded_at >= now() - interval '30 days'
GROUP BY source;

-- ── social_feed_curated view ──
DROP VIEW IF EXISTS v_social_feed_recent;
CREATE VIEW v_social_feed_recent
WITH (security_invoker = true) AS
SELECT *
FROM social_feed_curated
WHERE published_at >= now() - interval '7 days'
  AND (relevance_score IS NULL OR relevance_score >= 4.0)
ORDER BY relevance_score DESC NULLS LAST, published_at DESC
LIMIT 50;

-- ── Explicit grants ──
GRANT SELECT ON v_data_source_health_latest TO anon, authenticated;
GRANT SELECT ON v_data_source_uptime_30d   TO anon, authenticated;
GRANT SELECT ON v_social_feed_recent       TO anon, authenticated;

-- Underlying tables already have RLS public read policies; views with
-- security_invoker=true will respect them.
