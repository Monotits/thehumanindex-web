-- Migration 035 — v_country_latest_indicators: 14-day → 7-day window
--
-- 028 kept a (country, indicator) pair visible for 14 days after the pipeline
-- last produced it, to hide retired adapters. Side effect found in the
-- 2026-11-03 audit: values deliberately REMOVED from a source (untraceable
-- seeds — e.g. social trust for IL/ZA/AE, long working hours for JP/KR/SG/AE/IN,
-- divorce rate for FR/IN/AR/AE) stayed on indicator and country pages for two
-- more weeks although they no longer feed any score.
--
-- Seven days matches the carry-forward window (carryForward.ts): a pair the
-- score still uses through carry-forward stays visible, one dropped from the
-- source disappears within a week instead of two. The window is relative to the newest
-- snapshot, not to today, so a stalled cron does not blank the pages.

CREATE OR REPLACE VIEW v_country_latest_indicators
WITH (security_invoker = true) AS
SELECT DISTINCT ON (s.country_code, s.indicator_id)
  s.country_code,
  s.indicator_id,
  s.raw_value,
  s.normalized_value,
  s.reference_date,
  s.recorded_at AS fetched_at,
  s.primary_adapter,
  s.source_count,
  s.snapshot_date
FROM indicator_snapshots s
JOIN indicators i ON i.id = s.indicator_id AND i.active = true
JOIN countries  c ON c.code = s.country_code AND c.active = true
WHERE s.reference_date <= CURRENT_DATE
  AND s.snapshot_date >= (SELECT MAX(snapshot_date) FROM indicator_snapshots) - INTERVAL '7 days'
ORDER BY s.country_code, s.indicator_id, s.snapshot_date DESC;

GRANT SELECT ON v_country_latest_indicators TO anon, authenticated;
