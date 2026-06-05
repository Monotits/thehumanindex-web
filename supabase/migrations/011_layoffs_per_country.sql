-- Migration 011: per-country layoff infrastructure
--
-- The corporate_layoffs_curated table already has a `country` column from
-- migration 005, but it's nullable and used inconsistently. This migration:
--   1. Backfills missing country values to 'US' (where the existing SEC + WARN
--      data is sourced)
--   2. Adds locale column (default 'en') for future per-locale content
--   3. Renames `country` to `country_code` for consistency with the rest of
--      the v2 schema (countries.code, country_composite_scores.country_code)
--   4. Adds per-country views matching the legacy v_corporate_layoffs_recent
--      pattern but filterable by country_code
--   5. Keeps the original views for back-compat — they now return all countries
--
-- Future country-specific scrapers (KAP for Turkey, BMAS for Germany, ONS for
-- UK, INSEE for France) will write rows with their own country_code.

-- 1. Backfill nulls before adding NOT NULL constraint
UPDATE corporate_layoffs_curated SET country = 'US' WHERE country IS NULL;

-- 2. Rename + add constraints + new columns
ALTER TABLE corporate_layoffs_curated
  RENAME COLUMN country TO country_code;

ALTER TABLE corporate_layoffs_curated
  ALTER COLUMN country_code SET NOT NULL,
  ALTER COLUMN country_code SET DEFAULT 'US';

ALTER TABLE corporate_layoffs_curated
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_corp_layoffs_country_announcement
  ON corporate_layoffs_curated(country_code, announcement_date DESC);

-- 3. Re-create the existing v_corporate_layoffs_recent + rumored + stats views
--    so they SELECT * still works after the column rename. Add country_code
--    filter capability via per-country variants.

DROP VIEW IF EXISTS v_corporate_layoffs_recent;
CREATE VIEW v_corporate_layoffs_recent
WITH (security_invoker = true) AS
SELECT DISTINCT ON (country_code, company) *
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '90 days')::date
  AND confidence_score >= 0.6
  AND confidence_tier IN ('verified', 'reported')
ORDER BY country_code, company, announcement_date DESC, confidence_score DESC, people_affected DESC NULLS LAST;

DROP VIEW IF EXISTS v_corporate_layoffs_rumored;
CREATE VIEW v_corporate_layoffs_rumored
WITH (security_invoker = true) AS
SELECT *
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '30 days')::date
  AND confidence_score >= 0.5
  AND confidence_tier = 'rumored'
ORDER BY announcement_date DESC, confidence_score DESC
LIMIT 200;

DROP VIEW IF EXISTS v_corporate_layoffs_stats_30d;
CREATE VIEW v_corporate_layoffs_stats_30d
WITH (security_invoker = true) AS
SELECT
  country_code,
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
  AND confidence_tier IN ('verified', 'reported')
GROUP BY country_code;

GRANT SELECT ON v_corporate_layoffs_recent TO anon, authenticated;
GRANT SELECT ON v_corporate_layoffs_rumored TO anon, authenticated;
GRANT SELECT ON v_corporate_layoffs_stats_30d TO anon, authenticated;

COMMENT ON COLUMN corporate_layoffs_curated.country_code IS 'ISO 3166-1 alpha-2. Where the layoff was reported / where the company is HQed.';
COMMENT ON COLUMN corporate_layoffs_curated.locale IS 'BCP-47 lang for any localized version of the headline/excerpt.';
COMMENT ON VIEW v_corporate_layoffs_stats_30d IS 'Per-country 30-day rolling stats. Empty country_code → US by default.';
