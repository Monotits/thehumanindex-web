-- Migration 018: Historical indicator snapshots + trend views
--
-- Today the indicator_values table is append-only — every cron run writes
-- a row per (country, indicator, adapter). At ~12 runs/day × 25 countries
-- × 25 indicators × ~2 adapters average = ~15,000 rows/day. Querying
-- "what was X 30 days ago" is technically possible but expensive
-- (filter + ORDER BY + DISTINCT ON over millions of rows).
--
-- This migration adds a daily snapshot table: one row per (country,
-- indicator, day) with the day-end primary value. The cron upserts into
-- it idempotently — running the cron 12 times in a day still leaves one
-- snapshot row per pair per day.
--
-- That gives us clean trend queries: "value 30 days ago vs today" is
-- exactly two snapshot rows. And the v_indicator_30d_change view does it
-- for every active pair in a single seq scan.

CREATE TABLE IF NOT EXISTS indicator_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  country_code text NOT NULL,
  indicator_id text NOT NULL,
  raw_value numeric NOT NULL,
  normalized_value numeric,
  primary_adapter text,           -- which adapter was primary that day
  source_count integer DEFAULT 1, -- how many adapters reported
  reference_date date,            -- the data's own reference date (e.g. 2024-12-31)
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT snap_country_fk FOREIGN KEY (country_code)
    REFERENCES countries(code) ON DELETE CASCADE,
  CONSTRAINT snap_indicator_fk FOREIGN KEY (indicator_id)
    REFERENCES indicators(id) ON DELETE CASCADE,

  -- Idempotency: only one snapshot per (country, indicator, day)
  CONSTRAINT snap_unique_per_day UNIQUE (snapshot_date, country_code, indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_snap_country_indicator_recent
  ON indicator_snapshots (country_code, indicator_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snap_date
  ON indicator_snapshots (snapshot_date DESC);

ALTER TABLE indicator_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "snap_read_all" ON indicator_snapshots;
CREATE POLICY "snap_read_all" ON indicator_snapshots
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON indicator_snapshots TO anon, authenticated;

-- ── View: 30-day change per (country, indicator) ──
-- For every pair with a snapshot today AND a snapshot ~30 days ago,
-- compute absolute and percent change of normalized stress score.
-- Falls back to closest historical snapshot within 25-35 day window.

DROP VIEW IF EXISTS v_indicator_30d_change;

CREATE VIEW v_indicator_30d_change
WITH (security_invoker = true) AS
WITH latest AS (
  SELECT DISTINCT ON (country_code, indicator_id)
    country_code,
    indicator_id,
    snapshot_date AS today_date,
    raw_value AS today_raw,
    normalized_value AS today_normalized,
    primary_adapter
  FROM indicator_snapshots
  ORDER BY country_code, indicator_id, snapshot_date DESC
),
month_ago AS (
  SELECT DISTINCT ON (country_code, indicator_id)
    country_code,
    indicator_id,
    snapshot_date AS month_ago_date,
    raw_value AS month_ago_raw,
    normalized_value AS month_ago_normalized
  FROM indicator_snapshots
  WHERE snapshot_date BETWEEN (CURRENT_DATE - interval '35 days')
                          AND (CURRENT_DATE - interval '25 days')
  ORDER BY country_code, indicator_id, snapshot_date DESC
)
SELECT
  l.country_code,
  l.indicator_id,
  l.today_date,
  l.today_raw,
  l.today_normalized,
  l.primary_adapter,
  m.month_ago_date,
  m.month_ago_raw,
  m.month_ago_normalized,
  ROUND((l.today_normalized - m.month_ago_normalized)::numeric, 2) AS delta_normalized,
  CASE
    WHEN m.month_ago_normalized = 0 THEN NULL
    ELSE ROUND(((l.today_normalized - m.month_ago_normalized) / m.month_ago_normalized * 100)::numeric, 1)
  END AS pct_change_normalized,
  CASE
    WHEN m.month_ago_raw = 0 THEN NULL
    ELSE ROUND(((l.today_raw - m.month_ago_raw) / m.month_ago_raw * 100)::numeric, 1)
  END AS pct_change_raw
FROM latest l
LEFT JOIN month_ago m
  ON l.country_code = m.country_code AND l.indicator_id = m.indicator_id;

GRANT SELECT ON v_indicator_30d_change TO anon, authenticated;

-- ── View: composite 30-day trend per country ──
-- Same pattern but for country_composite_scores. Lets a dashboard show
-- "+2.3 since last month" arrows next to each country's composite.

DROP VIEW IF EXISTS v_composite_30d_change;

CREATE VIEW v_composite_30d_change
WITH (security_invoker = true) AS
WITH latest AS (
  SELECT DISTINCT ON (country_code)
    country_code,
    score_value AS today_value,
    band AS today_band,
    computed_at AS today_computed_at
  FROM country_composite_scores
  ORDER BY country_code, computed_at DESC
),
month_ago AS (
  SELECT DISTINCT ON (country_code)
    country_code,
    score_value AS month_ago_value,
    computed_at AS month_ago_computed_at
  FROM country_composite_scores
  WHERE computed_at BETWEEN (now() - interval '35 days')
                        AND (now() - interval '25 days')
  ORDER BY country_code, computed_at DESC
)
SELECT
  l.country_code,
  l.today_value,
  l.today_band,
  l.today_computed_at,
  m.month_ago_value,
  m.month_ago_computed_at,
  ROUND((l.today_value - COALESCE(m.month_ago_value, l.today_value))::numeric, 2) AS delta_30d
FROM latest l
LEFT JOIN month_ago m USING (country_code);

GRANT SELECT ON v_composite_30d_change TO anon, authenticated;
