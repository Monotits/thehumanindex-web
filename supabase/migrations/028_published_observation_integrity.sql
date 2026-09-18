-- Migration 028 — published-observation integrity (Astra audit 2026-09-18)
--
-- Fixes three P0 findings at the data layer:
--
--  P0-01  IMF WEO projections (reference_date up to 2031) were stored and
--         served as "Fresh" observations. Adapter now caps at the last
--         completed year; this migration purges the rows already written.
--
--  P0-02  v_country_latest_indicators picked "latest" by reference_date across
--         ALL adapters' rows in indicator_values, while the score pipeline
--         picks by adapter PRIORITY. Pages therefore showed values (and
--         sources) that never fed the score — e.g. a retired NASA GISS row
--         beating the Berkeley Earth seed, or a secondary source winning
--         because its reference year was newer.
--         The view now reads from indicator_snapshots, which holds exactly the
--         PRIMARY measurement the pipeline used, plus primary_adapter.
--
--  P0-06  research_articles gets a publication status so pieces built on the
--         retired ai_job_anxiety indicator can be pulled for review instead of
--         staying live.
--
-- RUN ORDER: apply this migration BEFORE deploying the matching app code, then
-- trigger /api/cron/refresh-v2 once so scores are recomputed without the
-- projection rows.

-- ── 1. Purge future-dated rows (projections stored as observations) ──
DO $$
DECLARE
  iv_deleted INTEGER := 0;
  snap_deleted INTEGER := 0;
BEGIN
  DELETE FROM indicator_values WHERE reference_date > CURRENT_DATE;
  GET DIAGNOSTICS iv_deleted = ROW_COUNT;

  DELETE FROM indicator_snapshots WHERE reference_date > CURRENT_DATE;
  GET DIAGNOSTICS snap_deleted = ROW_COUNT;

  RAISE NOTICE '028: purged % indicator_values rows and % indicator_snapshots rows with future reference_date',
    iv_deleted, snap_deleted;
END $$;

-- ── 2. Latest-indicator view = what the pipeline actually published ──
-- DROP (not REPLACE) because the column list changes.
DROP VIEW IF EXISTS v_country_latest_indicators;

CREATE VIEW v_country_latest_indicators
WITH (security_invoker = true) AS
SELECT DISTINCT ON (s.country_code, s.indicator_id)
  s.country_code,
  s.indicator_id,
  s.raw_value,
  s.normalized_value,
  s.reference_date,
  s.recorded_at AS fetched_at,
  s.primary_adapter,
  s.source_count,
  s.snapshot_date
FROM indicator_snapshots s
JOIN indicators i ON i.id = s.indicator_id AND i.active = true
JOIN countries  c ON c.code = s.country_code AND c.active = true
WHERE s.reference_date <= CURRENT_DATE
  -- Only pairs the pipeline still produces. A pair whose last snapshot is
  -- older than 14 days comes from a retired adapter and must not resurface.
  AND s.snapshot_date >= (SELECT MAX(snapshot_date) FROM indicator_snapshots) - INTERVAL '14 days'
ORDER BY s.country_code, s.indicator_id, s.snapshot_date DESC;

GRANT SELECT ON v_country_latest_indicators TO anon, authenticated;

-- ── 3. Research publication status ──
ALTER TABLE research_articles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'under_review', 'retracted')),
  ADD COLUMN IF NOT EXISTS status_note text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_research_status_published
  ON research_articles(status, published_at DESC);

-- Pull every article that leans on the retired ai_job_anxiety indicator
-- (single global value 79.8 / 99.7 applied to every country — see 022, 027).
DO $$
DECLARE
  flagged INTEGER := 0;
BEGIN
  UPDATE research_articles
  SET status = 'under_review',
      status_note = 'Withdrawn for review: cites the retired "AI job anxiety" indicator, which applied one global value to every country. See /methodology.',
      updated_at = now()
  WHERE status = 'published'
    AND (
      'ai_job_anxiety' = ANY(related_indicators)
      OR data_snapshot::text ILIKE '%ai_job_anxiety%'
      OR excerpt ~* 'ai[ -]?(job|employment)[ -]?anxiety'
      OR body_markdown ~* 'ai[ -]?(job|employment)[ -]?anxiety'
      OR excerpt ~ '(79\.8|99\.7)'
    );
  GET DIAGNOSTICS flagged = ROW_COUNT;
  RAISE NOTICE '028: % research articles moved to under_review', flagged;
END $$;

-- Review queue helper: what is currently withdrawn and why.
CREATE OR REPLACE VIEW v_research_review_queue
WITH (security_invoker = true) AS
SELECT slug, country_code, locale, title, status, status_note, published_at, updated_at
FROM research_articles
WHERE status <> 'published'
ORDER BY updated_at DESC NULLS LAST;
