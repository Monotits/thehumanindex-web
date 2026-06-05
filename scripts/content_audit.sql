-- ============================================================================
-- Content factory audit — Supabase SQL Editor'de çalıştır
-- (Pulse, Glossary, Research stock'unu görüntülemek için)
-- ============================================================================

-- ── 1. Pulse: per-country × per-locale son yayınlanan ──
SELECT
  COALESCE(country_code, 'global') AS country,
  COALESCE(locale, 'en')           AS locale,
  COUNT(*)                          AS pulse_count,
  MAX(created_at)                   AS last_published,
  EXTRACT(DAY FROM (now() - MAX(created_at))) AS days_since_last
FROM commentary
WHERE created_at > now() - interval '90 days'
GROUP BY 1, 2
ORDER BY days_since_last NULLS LAST, country, locale;

-- ── 2. Glossary: aktif ülke/locale matrisi ──
SELECT
  COALESCE(country_code, 'global') AS country,
  COALESCE(locale, 'en')           AS locale,
  COUNT(*)                         AS entries,
  MAX(created_at)                  AS last_added
FROM glossary_entries
GROUP BY 1, 2
ORDER BY entries DESC;

-- Eksik glossary kombinasyonları (5 active country × 2 locale = 10 hedef)
WITH targets AS (
  SELECT c.code AS country, l.locale
  FROM countries c
  CROSS JOIN (VALUES ('en'), ('tr')) AS l(locale)
  WHERE c.pulse_active = true OR c.code IN ('US','GB','DE','TR','JP')
)
SELECT t.country, t.locale,
       COALESCE(g.cnt, 0) AS glossary_count
FROM targets t
LEFT JOIN (
  SELECT country_code, locale, COUNT(*) AS cnt
  FROM glossary_entries
  GROUP BY 1, 2
) g ON g.country_code = t.country AND g.locale = t.locale
ORDER BY glossary_count, t.country;

-- ── 3. Research: yayınlanan makaleler ──
SELECT
  topic,
  COALESCE(country_code, 'global') AS country,
  COALESCE(locale, 'en')           AS locale,
  COUNT(*)                         AS article_count,
  MAX(created_at)                  AS last_published
FROM research_articles
GROUP BY 1, 2, 3
ORDER BY topic, country;

-- Hangi topic'ler hiç yazılmadı?
SELECT 'No articles for any topic yet' AS msg
WHERE NOT EXISTS (SELECT 1 FROM research_articles);

-- ── 4. Layoff curated stock ──
SELECT
  COALESCE(country_code, 'unknown') AS country,
  confidence_tier,
  COUNT(*) AS layoff_events,
  MAX(detected_at) AS most_recent
FROM corporate_layoffs_curated
WHERE detected_at > now() - interval '60 days'
GROUP BY 1, 2
ORDER BY layoff_events DESC;

-- ── 5. Social feed enrichment stock ──
SELECT
  source,
  curated,
  COUNT(*) AS posts
FROM social_feed_curated
WHERE created_at > now() - interval '7 days'
GROUP BY 1, 2
ORDER BY 1, 2;

-- ── 6. Composite score history (snapshot density check) ──
SELECT
  DATE(computed_at) AS day,
  COUNT(*) AS composites_written,
  COUNT(DISTINCT country_code) AS unique_countries
FROM country_composite_scores
WHERE computed_at > now() - interval '7 days'
GROUP BY 1
ORDER BY 1 DESC;
