-- Phase 2 Audit: Normalization Sanity Sweep
--
-- Goal: For every active indicator, check whether the stored
-- normalize_low / normalize_high / normalize_invert bounds match the
-- range of actual observed raw values across all countries.
--
-- Verdict logic (applied client-side in Python or by eye):
--   - OK:                    observed range sits inside bounds, normalized
--                            output covers >= 20 of the 0-100 scale
--   - CLAMPED_HIGH:          observed_max > normalize_high (when invert=false)
--                            or < normalize_low (when invert=true)
--                            → values frequently saturate at 100 stress
--   - CLAMPED_LOW:           observed_min < normalize_low (invert=false)
--                            → values often clamp to 0 stress
--   - NO_COVERAGE:           observed_max < normalize_low — bounds are
--                            way above any real value, indicator is dead
--   - TIGHT_RANGE:           normalized range (max-min) < 10 → low signal
--   - INVERT_SUSPECT:        invert=true but low > high (or vice versa)
--                            or invert=false but low > high
--
-- Run in Supabase SQL Editor; paste full JSON output back.

WITH ranges AS (
  SELECT
    i.id,
    i.name,
    i.meta_index,
    i.unit,
    i.normalize_low,
    i.normalize_high,
    i.normalize_invert,
    i.source_org,
    (SELECT MIN(raw_value)  FROM indicator_values v WHERE v.indicator_id = i.id) AS obs_min,
    (SELECT MAX(raw_value)  FROM indicator_values v WHERE v.indicator_id = i.id) AS obs_max,
    (SELECT AVG(raw_value)::numeric(10,2) FROM indicator_values v WHERE v.indicator_id = i.id) AS obs_avg,
    (SELECT MIN(normalized_value) FROM indicator_values v WHERE v.indicator_id = i.id) AS norm_min,
    (SELECT MAX(normalized_value) FROM indicator_values v WHERE v.indicator_id = i.id) AS norm_max,
    (SELECT COUNT(*) FROM indicator_values v WHERE v.indicator_id = i.id) AS n_observations,
    (SELECT COUNT(DISTINCT v.country_code) FROM indicator_values v WHERE v.indicator_id = i.id) AS n_countries
  FROM indicators i
  WHERE i.active = true
)
SELECT
  id,
  meta_index,
  name,
  unit,
  ROUND(normalize_low::numeric, 2)  AS norm_low,
  ROUND(normalize_high::numeric, 2) AS norm_high,
  normalize_invert                  AS inverted,
  ROUND(obs_min::numeric, 2)        AS obs_min,
  ROUND(obs_max::numeric, 2)        AS obs_max,
  obs_avg                           AS obs_avg,
  ROUND(norm_min::numeric, 1)       AS norm_min,
  ROUND(norm_max::numeric, 1)       AS norm_max,
  n_observations,
  n_countries,
  source_org
FROM ranges
ORDER BY meta_index, id;
