-- Migration 031: Live layer (fast-moving signals)
--
-- The composite (migration 007) is built from annual sources, so it barely
-- moves day to day. The Live layer adds fast signals — monthly labour /
-- price data, daily FX, job postings, active disasters — scored as
-- MOMENTUM relative to each country's own volatility:
--
--   stress_score = 100 × Φ(latest change / σ), σ = robust std (1.4826 × MAD)
--                  of the same change over the country's history.
--                  No change = 50; a one-σ deterioration = 84.
--
-- Levels stay in the Baseline composite; Live answers "is it getting worse
-- faster than usual right now?". Scores are stateless — recomputed from the
-- upstream series every run — so they are reproducible from public data.

CREATE TABLE IF NOT EXISTS live_signals (
  id text PRIMARY KEY,
  meta_index text NOT NULL CHECK (meta_index IN ('economic','social','mental','technological','environmental')),
  name text NOT NULL,
  description text,
  source_org text NOT NULL,
  source_url text,
  frequency text NOT NULL CHECK (frequency IN ('daily','weekly','monthly','event')),
  scoring text NOT NULL CHECK (scoring IN ('momentum_z','event')),
  weight numeric NOT NULL DEFAULT 1 CHECK (weight >= 0),
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0
);

INSERT INTO live_signals (id, meta_index, name, description, source_org, source_url, frequency, scoring, weight, display_order) VALUES
  ('unemployment_momentum', 'economic', 'Unemployment momentum',
   '6-month change in the monthly unemployment rate (pp), scaled by the country''s own historical volatility since 2010.',
   'OECD Infra-annual Labour Statistics', 'https://data-explorer.oecd.org/', 'monthly', 'momentum_z', 1, 10),
  ('inflation_momentum', 'economic', 'Inflation momentum',
   '6-month change in year-on-year consumer price inflation (pp), scaled by the country''s own historical volatility since 2010. Eurostat HICP for European countries, OECD CPI elsewhere.',
   'Eurostat HICP / OECD Prices', 'https://ec.europa.eu/eurostat/web/hicp', 'monthly', 'momentum_z', 1, 20),
  ('fx_pressure', 'economic', 'Currency pressure',
   '63-business-day (~3 month) percent change of the local currency per US dollar, scaled by the country''s own historical volatility since 2015. ECB reference rates.',
   'European Central Bank', 'https://data.ecb.europa.eu/data/datasets/EXR', 'daily', 'momentum_z', 1, 30),
  ('job_postings_momentum', 'technological', 'Job postings momentum',
   '90-day percent change in the Indeed Job Postings Index (seasonally adjusted), scaled by the country''s own historical volatility since 2020. Falling postings = higher stress. CC BY 4.0.',
   'Indeed Hiring Lab', 'https://github.com/hiring-lab/job_postings_tracker', 'daily', 'momentum_z', 1, 40),
  ('active_disasters', 'environmental', 'Active disasters',
   'Highest GDACS alert (earthquake, cyclone, flood, volcano, wildfire; droughts excluded) affecting the country in the last 30 days, decayed by age. No alert = 50 (normal), Orange = up to 75, Red = up to 100.',
   'GDACS (UN / European Commission)', 'https://www.gdacs.org/', 'event', 'event', 0.5, 50)
ON CONFLICT (id) DO UPDATE SET
  meta_index = EXCLUDED.meta_index, name = EXCLUDED.name, description = EXCLUDED.description,
  source_org = EXCLUDED.source_org, source_url = EXCLUDED.source_url, frequency = EXCLUDED.frequency,
  scoring = EXCLUDED.scoring, weight = EXCLUDED.weight, display_order = EXCLUDED.display_order;

-- One row per (day, country, signal). Idempotent upsert from the cron.
CREATE TABLE IF NOT EXISTS live_signal_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  country_code text NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  signal_id text NOT NULL REFERENCES live_signals(id) ON DELETE CASCADE,
  raw_value numeric NOT NULL,             -- the momentum metric (pp change, % change, alert score)
  stress_score numeric NOT NULL CHECK (stress_score >= 0 AND stress_score <= 100),
  reference_date date NOT NULL,           -- latest observation date in the upstream series
  history_n integer,                      -- size of the historical distribution used
  adapter_id text NOT NULL,
  payload jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_values_unique_per_day UNIQUE (snapshot_date, country_code, signal_id)
);
CREATE INDEX IF NOT EXISTS idx_live_values_country_recent
  ON live_signal_values (country_code, signal_id, snapshot_date DESC);

-- Daily Live score per country (weighted mean of available signals).
CREATE TABLE IF NOT EXISTS country_live_scores (
  snapshot_date date NOT NULL,
  country_code text NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  live_score numeric NOT NULL CHECK (live_score >= 0 AND live_score <= 100),
  live_score_7d numeric CHECK (live_score_7d >= 0 AND live_score_7d <= 100),
  signals_count integer NOT NULL,
  contributors jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (snapshot_date, country_code)
);
CREATE INDEX IF NOT EXISTS idx_live_scores_country_recent
  ON country_live_scores (country_code, snapshot_date DESC);

ALTER TABLE live_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_signal_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_live_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_signals_read_all" ON live_signals;
CREATE POLICY "live_signals_read_all" ON live_signals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "live_values_read_all" ON live_signal_values;
CREATE POLICY "live_values_read_all" ON live_signal_values FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "live_scores_read_all" ON country_live_scores;
CREATE POLICY "live_scores_read_all" ON country_live_scores FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON live_signals, live_signal_values, country_live_scores TO anon, authenticated;

-- Latest Live score per country.
DROP VIEW IF EXISTS v_country_latest_live;
CREATE VIEW v_country_latest_live WITH (security_invoker = true) AS
SELECT DISTINCT ON (country_code)
  country_code, snapshot_date, live_score, live_score_7d, signals_count, contributors, computed_at
FROM country_live_scores
ORDER BY country_code, snapshot_date DESC;

GRANT SELECT ON v_country_latest_live TO anon, authenticated;
