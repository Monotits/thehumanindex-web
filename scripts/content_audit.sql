-- ============================================================================
-- Content factory audit — Supabase SQL Editor'de çalıştır
-- (Pulse, Glossary, Research stock'unu görüntülemek için)
--
-- Kolon adları gerçek şemaya göre düzeltildi:
--   commentary, glossary_entries, research_articles → published_at
--   corporate_layoffs_curated → country_code, confidence_tier, extracted_at
--   social_feed_curated → published_at, fetched_at, enriched_at
-- ============================================================================

-- ── 1. Pulse: per-country × per-locale son yayınlanan ──
SELECT
  COALESCE(country_code, 'global') AS country,
  COALESCE(locale, 'en')           AS locale,
  COUNT(*)                          AS pulse_count,
  MAX(published_at)                 AS last_published,
  EXTRACT(DAY FROM (now() - MAX(published_at)))::int AS days_since_last
FROM commentary
WHERE published_at > now() - interval '90 days'
GROUP BY 1, 2
ORDER BY days_since_last NULLS LAST, country, locale;

-- ── 2. Glossary: aktif ülke/locale matrisi ──
SELECT
  COALESCE(country_code, 'global') AS country,
  COALESCE(locale, 'en')           AS locale,
  COUNT(*)                         AS entries,
  MAX(published_at)                AS last_added
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
  MAX(published_at)                AS last_published
FROM research_articles
GROUP BY 1, 2, 3
ORDER BY topic, country;

-- Hangi topic'ler hiç yazılmadı? (toplam article sayısı 0 ise göster)
SELECT 'No articles yet' AS msg
WHERE NOT EXISTS (SELECT 1 FROM research_articles);

-- ── 4. Layoff curated stock (son 60 gün) ──
SELECT
  COALESCE(country_code, 'unknown') AS country,
  confidence_tier,
  COUNT(*) AS layoff_events,
  MAX(extracted_at) AS most_recent
FROM corporate_layoffs_curated
WHERE extracted_at > now() - interval '60 days'
GROUP BY 1, 2
ORDER BY layoff_events DESC;

-- ── 5. Social feed enrichment stock (son 7 gün) ──
SELECT
  source,
  CASE WHEN enriched_at IS NOT NULL THEN 'enriched' ELSE 'pending' END AS state,
  COUNT(*) AS posts
FROM social_feed_curated
WHERE fetched_at > now() - interval '7 days'
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

-- ── 7. Indicator snapshots stock (migration 018 sonrası) ──
SELECT
  snapshot_date,
  COUNT(*) AS snapshot_rows,
  COUNT(DISTINCT country_code) AS countries,
  COUNT(DISTINCT indicator_id) AS indicators
FROM indicator_snapshots
WHERE snapshot_date > CURRENT_DATE - 7
GROUP BY 1
ORDER BY 1 DESC;

-- ── 8. Cross-source validation stock (migration 017 sonrası) ──
SELECT
  status,
  COUNT(*) AS validations
FROM cross_source_validations
WHERE run_at > now() - interval '7 days'
GROUP BY 1
ORDER BY 1;

-- Persistent divergence streaks
SELECT * FROM v_recent_divergence_streaks LIMIT 10;
