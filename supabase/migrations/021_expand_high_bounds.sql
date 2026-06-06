-- Migration 021: Expand 9 indicators' high bounds (Audit Phase 2 finding)
--
-- Phase 2 normalization sanity sweep found observed maxes exceeding the
-- stored normalize_high for 9 indicators, causing top-stress countries
-- to saturate at stress=100 and become indistinguishable.
--
-- Each line below: new high chosen so that highest-stress country
-- still gets meaningful headroom (not 100), and the bound matches the
-- actual long-tail of observed values.

UPDATE indicators SET normalize_high = 20  WHERE id = 'unemployment_rate';        -- 12 → 20 (ZA 32 → stress 100, was 100; ZA now 167% out, clamped 100, but TR 8% now 30 not 60)
UPDATE indicators SET normalize_high = 45  WHERE id = 'youth_unemployment_rate';  -- 25 → 45 (ES/IT ~30 → now 50, was 100)
UPDATE indicators SET normalize_high = 40  WHERE id = 'homicide_rate';            -- 30 → 40 (MX/ZA at 30+ → no longer clamped)
UPDATE indicators SET normalize_high = 30  WHERE id = 'suicide_rate';             -- 25 → 30 (KR/JP/LT at 25-28 → headroom)
UPDATE indicators SET normalize_high = 200 WHERE id = 'gov_debt_pct_gdp';         -- 150 → 200 (JP 260% will still hit but US/UK 117/131 distinct)
UPDATE indicators SET normalize_high = 95  WHERE id = 'water_stress';             -- 80 → 95 (AE 90 → 84 not 100)
UPDATE indicators SET normalize_high = 60  WHERE id = 'air_pollution';            -- 50 → 60 (IN 53 → 87 not 100)
UPDATE indicators SET normalize_high = 16  WHERE id = 'housing_affordability';    -- 12 → 16 (HK pattern 14-15 distinct)
UPDATE indicators SET normalize_high = 10  WHERE id = 'screen_time';              -- 8 → 10 (AR 9.7 distinct from US 7)

-- Sanity verify post-migration:
--   SELECT id, normalize_low, normalize_high, normalize_invert
--   FROM indicators
--   WHERE id IN ('unemployment_rate','youth_unemployment_rate','homicide_rate',
--                'suicide_rate','gov_debt_pct_gdp','water_stress','air_pollution',
--                'housing_affordability','screen_time')
--   ORDER BY id;
