-- Migration 027 — purge stale ai_job_anxiety measurements (Faz 17.4)
--
-- BACKGROUND
-- ----------
-- ai_job_anxiety was disabled in migration 022 because the social-feed
-- adapter produced a single GLOBAL value (79.8) that was applied to every
-- country uniformly — zero per-country discriminating power, and a direct
-- contradiction of the platform's "every score traceable" promise.
--
-- Migration 022 set indicators.active = false; the v2 cron stops fetching it
-- (orchestrator filters by active=true). But the historical measurements
-- written before that disable still sit in indicator_measurements and
-- still surface through v_country_latest_indicators (which is a "latest of
-- all time per (country, indicator)" view, not a recency-bounded view).
--
-- Live-site audit (Claude Opus 4.8, 2026-06-07) flagged this directly:
--   "AI Job Anxiety" cited as a headline metric in Pulse articles
--   (KR=JP=DE=79.8) but absent from the public indicator catalog —
--   the most damaging form of inconsistency for a platform whose
--   value proposition is "every number traceable."
--
-- DECISION
-- --------
-- Hard-delete stale ai_job_anxiety measurements. Three reasons:
--   1. They're not surfaced anywhere honestly: the public catalog
--      filters by active=true, so users CAN'T trace them.
--   2. They make v_country_latest_indicators serve numbers that
--      contradict the catalog. Keeping them is keeping a lie.
--   3. The values themselves were never country-specific to begin
--      with — there's nothing to preserve as history.
--
-- This is destructive but bounded. If we ever re-enable a real per-country
-- ai_job_anxiety adapter, it starts fresh; nothing of value is lost.

DO $$
DECLARE
  measurements_deleted INTEGER := 0;
  snapshots_deleted INTEGER := 0;
BEGIN
  -- 1. Delete raw measurements
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'indicator_measurements'
  ) THEN
    DELETE FROM public.indicator_measurements
    WHERE indicator_id = 'ai_job_anxiety';
    GET DIAGNOSTICS measurements_deleted = ROW_COUNT;
    RAISE NOTICE 'Migration 027: deleted % rows from indicator_measurements', measurements_deleted;
  END IF;

  -- 2. Delete historical snapshots (used by trend API + sparklines)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'indicator_snapshots'
  ) THEN
    DELETE FROM public.indicator_snapshots
    WHERE indicator_id = 'ai_job_anxiety';
    GET DIAGNOSTICS snapshots_deleted = ROW_COUNT;
    RAISE NOTICE 'Migration 027: deleted % rows from indicator_snapshots', snapshots_deleted;
  END IF;

  -- 3. Delete cross-source validations referencing this indicator
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cross_source_validations'
  ) THEN
    DELETE FROM public.cross_source_validations
    WHERE indicator_id = 'ai_job_anxiety';
  END IF;

  -- The indicators catalog row itself stays (active = false from migration
  -- 022). Keeping the row preserves history of *what was tried* — a future
  -- maintainer reading the catalog with active=false rows still finds the
  -- decision trail. The row's name field changes below.
END $$;

-- Soft-deprecation marker on the catalog row so any debug query that
-- bypasses active=true (eg. SELECT * FROM indicators) shows the disposition.
UPDATE public.indicators
SET name = 'AI Job Anxiety (DEPRECATED — global proxy, no per-country signal)'
WHERE id = 'ai_job_anxiety'
  AND active = false;

-- Sanity verify (commented; run manually post-deploy if curious):
--   SELECT COUNT(*) FROM indicator_measurements WHERE indicator_id = 'ai_job_anxiety';
--   SELECT id, name, active FROM indicators WHERE id = 'ai_job_anxiety';
