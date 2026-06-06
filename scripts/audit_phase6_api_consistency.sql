-- Phase 6 Audit: API ↔ DB Consistency
--
-- This script produces the canonical "truth" rows that each public read
-- API endpoint is supposed to return. The operator then:
--   1. Runs this SQL and pastes the JSON output
--   2. Hits each corresponding API endpoint via curl and pastes the JSON
--   3. Auditor (Claude) cross-checks key fields row by row
--
-- Coverage:
--   A. /api/transparency/US           ← v_indicator_source_breakdown
--   B. /api/trends/US/unemployment_rate ← indicator_snapshots (last 90d)
--   C. /api/glossary?country=US&locale=en ← glossary_entries
--   D. /api/research?country=US&locale=en ← research_articles
--   E. /api/pulse?latest=per_country     ← v_commentary_latest_per_country

-- =============================================================
-- A. Transparency truth for US (per-indicator latest reading)
-- =============================================================
SELECT 'A_transparency' AS section, *
FROM (
  SELECT 'US' AS country_code, indicator_id, adapter_id,
         ROUND(raw_value::numeric, 3) AS raw_value,
         ROUND(normalized_value::numeric, 2) AS normalized_value,
         reference_date,
         recorded_at
  FROM v_indicator_source_breakdown
  WHERE country_code = 'US'
  ORDER BY indicator_id, adapter_id
  LIMIT 12
) sub;

-- =============================================================
-- B. Trends truth for US × unemployment_rate (last 30 daily snaps)
-- =============================================================
SELECT 'B_trends' AS section, *
FROM (
  SELECT snapshot_date,
         ROUND(raw_value::numeric, 3) AS raw,
         ROUND(normalized_value::numeric, 2) AS normalized,
         primary_adapter, source_count
  FROM indicator_snapshots
  WHERE country_code = 'US' AND indicator_id = 'unemployment_rate'
  ORDER BY snapshot_date DESC
  LIMIT 10
) sub;

-- =============================================================
-- C. Glossary truth: US/en, alphabetical by term, limit 5
-- =============================================================
SELECT 'C_glossary' AS section, *
FROM (
  SELECT id, slug, term,
         LEFT(short_definition, 60) AS def_preview,
         related_indicators,
         published_at::date AS published_date
  FROM glossary_entries
  WHERE country_code = 'US' AND locale = 'en'
  ORDER BY term
  LIMIT 5
) sub;

-- =============================================================
-- D. Research truth: US/en, latest 5
-- =============================================================
SELECT 'D_research' AS section, *
FROM (
  SELECT id, slug, topic_id, title,
         word_count, reading_time_min,
         published_at::date AS published_date
  FROM research_articles
  WHERE country_code = 'US' AND locale = 'en'
  ORDER BY published_at DESC
  LIMIT 5
) sub;

-- =============================================================
-- E. Pulse latest per country (en locale)
-- =============================================================
SELECT 'E_pulse_latest' AS section, *
FROM (
  SELECT country_code, locale, title, slug,
         published_at::date AS published_date
  FROM v_commentary_latest_per_country
  WHERE locale = 'en' AND type = 'weekly_pulse'
  ORDER BY country_code
) sub;
