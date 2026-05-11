-- Migration 005: corporate_layoffs_curated
-- Structured layoff records extracted by Claude (PD dashboard) from Reddit,
-- RSS news, and other sources. Replaces the regex-based pipeline in
-- src/lib/corporateLayoffs.ts for the production feed.

CREATE TABLE IF NOT EXISTS corporate_layoffs_curated (
  id text PRIMARY KEY,                            -- 'reddit-<post-id>' / 'news-<url-hash>'
  company text NOT NULL,                          -- canonical company name (e.g. 'Meta' not 'Zuckerberg')
  people_affected int,                            -- # workers laid off (nullable when unclear)
  workforce_percent numeric(5,2),                 -- % of total workforce
  total_employees int,                            -- total company headcount for context
  industry text,
  country text,
  reasons text[] NOT NULL DEFAULT '{}',           -- AI_DRIVEN, RESTRUCTURING, COST_CUTTING, AUTOMATION, MERGER, WEAK_DEMAND, MARKET_SHIFT
  is_ai_driven boolean NOT NULL DEFAULT false,    -- convenience flag (reasons @> '{AI_DRIVEN,AUTOMATION}')
  announcement_date date NOT NULL,                -- when the layoff was announced
  source_type text NOT NULL,                      -- 'reddit' | 'news' | 'warn' | 'official'
  source_name text NOT NULL,                      -- 'r/layoffs', 'Reuters', etc.
  source_url text NOT NULL,
  headline text NOT NULL,
  excerpt text,
  confidence_score numeric(3,2) NOT NULL,         -- 0.00-1.00 from Claude
  extracted_at timestamptz NOT NULL DEFAULT now(),
  extraction_model text,
  raw_payload jsonb
);

CREATE INDEX IF NOT EXISTS idx_corp_layoffs_announcement
  ON corporate_layoffs_curated(announcement_date DESC);

CREATE INDEX IF NOT EXISTS idx_corp_layoffs_company_date
  ON corporate_layoffs_curated(company, announcement_date DESC);

CREATE INDEX IF NOT EXISTS idx_corp_layoffs_confidence
  ON corporate_layoffs_curated(confidence_score DESC, announcement_date DESC);

-- View: deduplicated by company (latest announcement per company) within last 90 days
-- filtered to confidence >= 0.6, ordered by recency × headcount weight
CREATE OR REPLACE VIEW v_corporate_layoffs_recent
WITH (security_invoker = true) AS
SELECT DISTINCT ON (company) *
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '90 days')::date
  AND confidence_score >= 0.6
ORDER BY company, announcement_date DESC, confidence_score DESC, people_affected DESC NULLS LAST;

-- View: 30-day aggregate stats
CREATE OR REPLACE VIEW v_corporate_layoffs_stats_30d
WITH (security_invoker = true) AS
SELECT
  COUNT(DISTINCT company) AS total_companies,
  COALESCE(SUM(people_affected), 0)::int AS total_affected,
  COUNT(*) FILTER (WHERE is_ai_driven) AS ai_driven_events,
  COUNT(*) AS total_events,
  COALESCE(ROUND(
    COUNT(*) FILTER (WHERE is_ai_driven)::numeric
    / NULLIF(COUNT(*), 0) * 100, 0
  ), 0)::int AS ai_driven_percent
FROM corporate_layoffs_curated
WHERE announcement_date >= (now() - interval '30 days')::date
  AND confidence_score >= 0.6;

ALTER TABLE corporate_layoffs_curated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read corporate_layoffs_curated"
  ON corporate_layoffs_curated FOR SELECT USING (true);

GRANT SELECT ON corporate_layoffs_curated TO anon, authenticated;
GRANT SELECT ON v_corporate_layoffs_recent TO anon, authenticated;
GRANT SELECT ON v_corporate_layoffs_stats_30d TO anon, authenticated;

COMMENT ON TABLE corporate_layoffs_curated IS 'Claude-extracted layoff records. Populated by PD dashboard, read by thehumanindex-web.';
COMMENT ON VIEW v_corporate_layoffs_recent IS 'Deduplicated by company (latest per company) within 90 days, confidence >= 0.6.';
COMMENT ON VIEW v_corporate_layoffs_stats_30d IS 'Aggregate stats for the Layoff Tracker tile.';
