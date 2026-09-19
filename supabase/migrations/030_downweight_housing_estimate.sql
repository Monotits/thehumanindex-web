-- Migration 030 — down-weight housing_affordability until a citable source exists
--
-- Decision (Buğra, 2026-09-19): the housing values are compiled estimates with
-- no per-value citation (see 029 + oecdHousing.ts). Until they are replaced by a
-- citable LEVEL source, the indicator counts at half weight inside the Economic
-- meta-index — the same factor the methodology applies to stale data.
--
-- Effect: Economic meta-index (and composite) shift slightly for every country
-- on the next /api/cron/refresh-v2 run. This is a methodology change, not a
-- change in living conditions.
--
-- REVERT when re-sourced:  UPDATE indicators SET weight_within_meta = 1.0 WHERE id = 'housing_affordability';

UPDATE indicators
SET weight_within_meta = 0.5
WHERE id = 'housing_affordability';