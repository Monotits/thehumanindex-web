-- Migration 002: data_source_health
-- Tracks per-source health for each cron run. Append-only log.
-- Powers /data-sources public page and confidence score on dashboard.

CREATE TABLE IF NOT EXISTS data_source_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,                          -- 'BLS', 'FRED', 'World Bank', 'OECD', 'WHO', 'O*NET', 'FBI', 'AI Index', etc.
  status text NOT NULL CHECK (status IN ('ok', 'degraded', 'failed')),
  last_success_at timestamptz,                   -- last successful fetch timestamp (carried forward when failing)
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,                               -- error message if status != 'ok'
  data_points_count int NOT NULL DEFAULT 0,      -- # data points returned this run
  domains_covered text[] DEFAULT '{}',           -- which THI domains this source feeds
  duration_ms int,                               -- fetch duration
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_source_health_source_recorded
  ON data_source_health(source, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_source_health_recorded
  ON data_source_health(recorded_at DESC);

-- View: latest snapshot per source (for fast UI reads)
CREATE OR REPLACE VIEW v_data_source_health_latest AS
SELECT DISTINCT ON (source) *
FROM data_source_health
ORDER BY source, recorded_at DESC;

-- 30-day uptime per source: % of runs that returned status='ok'
CREATE OR REPLACE VIEW v_data_source_uptime_30d AS
SELECT
  source,
  COUNT(*) FILTER (WHERE status = 'ok')::float / NULLIF(COUNT(*), 0) AS uptime,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'ok') AS successful_runs,
  MAX(last_success_at) AS most_recent_success
FROM data_source_health
WHERE recorded_at >= now() - interval '30 days'
GROUP BY source;

-- RLS: public read (this is a transparency/credibility feature)
ALTER TABLE data_source_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read data_source_health"
  ON data_source_health FOR SELECT USING (true);

-- Service role can write (cron uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)
-- No INSERT/UPDATE policy needed for public.

COMMENT ON TABLE data_source_health IS 'Append-only health log for external API sources. One row per source per cron run.';
COMMENT ON VIEW v_data_source_health_latest IS 'Latest health snapshot per source. Read this for dashboard widgets.';
COMMENT ON VIEW v_data_source_uptime_30d IS '30-day uptime % per source. Read this for /data-sources page.';
