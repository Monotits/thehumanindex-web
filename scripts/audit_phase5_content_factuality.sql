-- Phase 5 Audit: Content Factuality
--
-- For each sample content row (Pulse + Glossary + Research), pull the
-- body_markdown so the auditor can extract numeric claims and verify
-- against the latest indicator_values for that country.
--
-- Operator: run sections in order, paste FULL JSON output for each. The
-- body_markdown fields are large but necessary.

-- =============================================================
-- 5a. Pulse samples — top 5 stress countries × en
-- =============================================================
SELECT 'A_pulse_US' AS section,
  c.country_code, c.locale, c.title, c.slug,
  c.body_markdown,
  c.published_at::date AS published_date
FROM commentary c
WHERE c.type='weekly_pulse' AND c.country_code='US' AND c.locale='en'
ORDER BY c.published_at DESC LIMIT 1;

SELECT 'A_pulse_TR' AS section,
  c.country_code, c.locale, c.title, c.slug,
  c.body_markdown,
  c.published_at::date AS published_date
FROM commentary c
WHERE c.type='weekly_pulse' AND c.country_code='TR' AND c.locale='en'
ORDER BY c.published_at DESC LIMIT 1;

SELECT 'A_pulse_GB' AS section,
  c.country_code, c.locale, c.title, c.slug,
  c.body_markdown,
  c.published_at::date AS published_date
FROM commentary c
WHERE c.type='weekly_pulse' AND c.country_code='GB' AND c.locale='en'
ORDER BY c.published_at DESC LIMIT 1;

SELECT 'A_pulse_JP' AS section,
  c.country_code, c.locale, c.title, c.slug,
  c.body_markdown,
  c.published_at::date AS published_date
FROM commentary c
WHERE c.type='weekly_pulse' AND c.country_code='JP' AND c.locale='en'
ORDER BY c.published_at DESC LIMIT 1;

-- =============================================================
-- 5b. Glossary samples — 5 entries with indicator references
-- =============================================================
SELECT 'B_glossary' AS section,
  g.country_code, g.locale, g.slug, g.term,
  g.body_markdown,
  g.related_indicators
FROM glossary_entries g
WHERE g.country_code='US' AND g.locale='en'
  AND ARRAY_LENGTH(g.related_indicators, 1) > 0
ORDER BY g.published_at DESC LIMIT 3;

-- =============================================================
-- 5c. Research samples — US/en + GB/en + JP/en (3 articles)
-- =============================================================
SELECT 'C_research_US' AS section,
  r.country_code, r.locale, r.slug, r.title, r.topic_id,
  r.body_markdown,
  r.related_indicators,
  r.data_snapshot
FROM research_articles r
WHERE r.country_code='US' AND r.locale='en'
ORDER BY r.published_at DESC LIMIT 1;

-- =============================================================
-- 5d. Reference data: US indicator values at time of Pulse publish
-- =============================================================
SELECT 'D_us_indicators' AS section,
  iv.indicator_id,
  ROUND(iv.raw_value::numeric, 3) AS raw,
  ROUND(iv.normalized_value::numeric, 2) AS normalized,
  iv.reference_date,
  iv.payload->>'adapter_id' AS adapter
FROM v_indicator_source_breakdown iv
WHERE iv.country_code='US'
ORDER BY iv.indicator_id;

-- =============================================================
-- 5e. Reference data: TR indicator values
-- =============================================================
SELECT 'E_tr_indicators' AS section,
  iv.indicator_id,
  ROUND(iv.raw_value::numeric, 3) AS raw,
  ROUND(iv.normalized_value::numeric, 2) AS normalized,
  iv.reference_date,
  iv.payload->>'adapter_id' AS adapter
FROM v_indicator_source_breakdown iv
WHERE iv.country_code='TR'
ORDER BY iv.indicator_id;
