-- Phase 3 Audit: Composite Recompute
--
-- Extracts latest composite per active country + its 5 meta-index rows
-- (one per meta-index). We then recompute composite manually using
-- DEFAULT_META_WEIGHTS (eco 0.25, soc 0.20, men 0.20, tec 0.20, env 0.15)
-- and compare to the stored value.
--
-- Drift > 0.1 → flag for investigation.
--
-- Run in Supabase SQL Editor; export full result as JSON and paste back.

WITH latest_composite AS (
  SELECT DISTINCT ON (country_code)
    id, country_code, score_value, band, confidence, computed_at,
    meta_indexes_with_data, meta_indexes_total
  FROM country_composite_scores
  ORDER BY country_code, computed_at DESC
)
SELECT
  lc.country_code,
  ROUND(lc.score_value::numeric, 2) AS stored_composite,
  lc.band,
  lc.confidence,
  lc.meta_indexes_with_data AS metas_with_data,
  m.meta_index,
  ROUND(m.value::numeric, 2) AS meta_value,
  ROUND(m.weight::numeric, 3) AS meta_weight,
  m.indicators_count,
  m.indicators_with_data
FROM latest_composite lc
JOIN meta_index_scores m ON m.country_composite_score_id = lc.id
ORDER BY lc.country_code, m.meta_index;
