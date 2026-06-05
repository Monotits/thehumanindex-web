-- Migration 017: persisted cross-source validation history
--
-- Background: the v2 cron already computes cross-source divergences (when
-- multiple adapters report the same indicator for a country, we check how
-- much they disagree). Today these warnings are buried inside
-- country_composite_scores.metadata.divergences (JSONB blob, one snapshot
-- per composite row). That means:
--   - We can't query "show me indicators that disagreed >2 runs in a row"
--   - We can't trend divergence over time
--   - We can't power a public transparency UI cleanly
--
-- This migration adds a dedicated, append-only table for divergence events
-- (one row per (country, indicator) per run) and a view that surfaces
-- "divergence streaks" — indicators that have flagged warnings on multiple
-- consecutive runs.
--
-- Schema is intentionally simple: the JSONB observations array holds every
-- adapter's value, so we don't need to redesign when adapter count changes.

CREATE TABLE IF NOT EXISTS cross_source_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamp with time zone NOT NULL DEFAULT now(),
  country_code text NOT NULL,
  indicator_id text NOT NULL,
  -- [{adapter_id: 'worldBank', raw_value: 5.2, reference_date: '2024-12-31'}, ...]
  observations jsonb NOT NULL,
  divergence_pct numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'warning', 'critical')),
  threshold_pct numeric NOT NULL,
  metadata jsonb,

  CONSTRAINT csv_country_fk FOREIGN KEY (country_code)
    REFERENCES countries(code) ON DELETE CASCADE,
  CONSTRAINT csv_indicator_fk FOREIGN KEY (indicator_id)
    REFERENCES indicators(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_csv_country_indicator_recent
  ON cross_source_validations (country_code, indicator_id, run_at DESC);

CREATE INDEX IF NOT EXISTS idx_csv_status_recent
  ON cross_source_validations (status, run_at DESC)
  WHERE status != 'ok';

CREATE INDEX IF NOT EXISTS idx_csv_run_at
  ON cross_source_validations (run_at DESC);

ALTER TABLE cross_source_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "csv_read_all" ON cross_source_validations;
CREATE POLICY "csv_read_all" ON cross_source_validations
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON cross_source_validations TO anon, authenticated;

-- ── View: divergence streaks (recent persistent disagreements) ──
-- Looks at the last 10 runs for each (country, indicator) pair within the
-- past 30 days. Surfaces pairs where at least 2 of those runs flagged a
-- non-OK divergence. Ordered by total warnings then most recent.
--
-- This is the query a "credibility transparency" page would consume to show
-- "we know these indicators are currently noisy and here's how often".

DROP VIEW IF EXISTS v_recent_divergence_streaks;

CREATE VIEW v_recent_divergence_streaks
WITH (security_invoker = true) AS
WITH ranked AS (
  SELECT
    country_code,
    indicator_id,
    status,
    divergence_pct,
    run_at,
    ROW_NUMBER() OVER (
      PARTITION BY country_code, indicator_id
      ORDER BY run_at DESC
    ) AS rn
  FROM cross_source_validations
  WHERE run_at > now() - interval '30 days'
)
SELECT
  country_code,
  indicator_id,
  COUNT(*) FILTER (WHERE status != 'ok') AS divergent_runs,
  COUNT(*) AS observed_runs,
  ROUND(AVG(divergence_pct) FILTER (WHERE status != 'ok')::numeric, 1) AS avg_divergence_pct_when_warning,
  MAX(run_at) FILTER (WHERE status != 'ok') AS last_divergent_at,
  MAX(run_at) AS last_observed_at
FROM ranked
WHERE rn <= 10
GROUP BY country_code, indicator_id
HAVING COUNT(*) FILTER (WHERE status != 'ok') >= 2
ORDER BY divergent_runs DESC, last_divergent_at DESC;

GRANT SELECT ON v_recent_divergence_streaks TO anon, authenticated;

-- ── View: indicator source breakdown (latest value per adapter per pair) ──
-- For a given (country, indicator), what did each source most recently say?
-- This powers the "/api/transparency/[country]" endpoint that lets users see
-- exactly how each number was sourced and validated.

DROP VIEW IF EXISTS v_indicator_source_breakdown;

CREATE VIEW v_indicator_source_breakdown
WITH (security_invoker = true) AS
SELECT DISTINCT ON (iv.country_code, iv.indicator_id, iv.payload->>'adapter_id')
  iv.country_code,
  iv.indicator_id,
  COALESCE(iv.payload->>'adapter_id', 'unknown') AS adapter_id,
  iv.raw_value,
  iv.normalized_value,
  iv.reference_date,
  iv.created_at AS recorded_at,
  iv.payload
FROM indicator_values iv
ORDER BY
  iv.country_code,
  iv.indicator_id,
  iv.payload->>'adapter_id',
  iv.created_at DESC;

GRANT SELECT ON v_indicator_source_breakdown TO anon, authenticated;

-- Sanity comment: a typical cron-v2 run with 40 cross-checks adds 40 rows
-- (one per validated pair). At ~12 runs/day that's ~480 rows/day or
-- ~175k rows/year — well within Supabase free-tier budget.
