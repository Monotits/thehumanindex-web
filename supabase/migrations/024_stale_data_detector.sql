-- Migration 024: Stale data detector view (Audit Phase 5/7 finding)
--
-- Some indicators carry reference_date values that are several years old —
-- e.g., TR alcohol_consumption (2020), TR suicide_rate (2021) — because
-- World Bank's publication cadence lags. This is OK editorially but
-- should be SURFACED so:
--   1. The operator can see at a glance which indicators need attention
--   2. The transparency API can carry a "data is N years old" badge
--   3. The annual seed refresh ritual can prioritize the most stale
--
-- A reference_date older than 3 years is flagged as STALE.
-- A reference_date older than 5 years is flagged as VERY_STALE.

CREATE OR REPLACE VIEW v_stale_indicator_values
WITH (security_invoker = true) AS
WITH latest_per_pair AS (
  SELECT DISTINCT ON (country_code, indicator_id)
    country_code,
    indicator_id,
    raw_value,
    reference_date,
    payload->>'adapter_id' AS adapter_id,
    fetched_at,
    (CURRENT_DATE - reference_date::date) AS days_old
  FROM indicator_values
  ORDER BY country_code, indicator_id, fetched_at DESC
)
SELECT
  country_code,
  indicator_id,
  adapter_id,
  raw_value,
  reference_date,
  days_old,
  ROUND((days_old / 365.25)::numeric, 1) AS years_old,
  CASE
    WHEN days_old > 365 * 5 THEN 'VERY_STALE'
    WHEN days_old > 365 * 3 THEN 'STALE'
    WHEN days_old > 365 * 2 THEN 'AGING'
    ELSE 'FRESH'
  END AS freshness
FROM latest_per_pair
WHERE days_old > 365 * 2  -- only surface anything 2+ years old
ORDER BY days_old DESC;

GRANT SELECT ON v_stale_indicator_values TO anon, authenticated;

-- Summary view: how many (country, indicator) pairs are stale by tier?
CREATE OR REPLACE VIEW v_stale_indicators_summary
WITH (security_invoker = true) AS
SELECT
  indicator_id,
  COUNT(*) AS total_country_pairs,
  COUNT(*) FILTER (WHERE freshness = 'VERY_STALE') AS very_stale_count,
  COUNT(*) FILTER (WHERE freshness = 'STALE') AS stale_count,
  COUNT(*) FILTER (WHERE freshness = 'AGING') AS aging_count,
  MIN(reference_date) AS oldest_reference_date,
  MAX(reference_date) AS newest_reference_date
FROM v_stale_indicator_values
GROUP BY indicator_id
ORDER BY very_stale_count DESC, stale_count DESC;

GRANT SELECT ON v_stale_indicators_summary TO anon, authenticated;

-- Sanity verify:
--   SELECT * FROM v_stale_indicators_summary;
--   -- Expected: alcohol, suicide, renewable etc. with stale values
--
--   SELECT * FROM v_stale_indicator_values LIMIT 20;
--   -- Expected: rows ordered by days_old DESC
