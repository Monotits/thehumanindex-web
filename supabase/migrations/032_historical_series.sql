-- Migration 032: Historical structural index (HSI), annual 2000 → last full year.
--
-- Built only from indicators with genuine annual histories at one source
-- (World Bank). Static-seed indicators are excluded, not held constant.
-- Separate from the live composite and labelled as such on the site.

CREATE TABLE IF NOT EXISTS historical_indicator_values (
  country_code text NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  indicator_id text NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  year integer NOT NULL CHECK (year BETWEEN 1960 AND 2100),
  raw_value numeric NOT NULL,
  normalized_value numeric,
  source text NOT NULL DEFAULT 'worldBank',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (country_code, indicator_id, year)
);

CREATE TABLE IF NOT EXISTS historical_scores (
  country_code text NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  year integer NOT NULL CHECK (year BETWEEN 1960 AND 2100),
  composite numeric CHECK (composite >= 0 AND composite <= 100),
  meta jsonb NOT NULL,
  indicators_used integer NOT NULL,
  indicators_total integer NOT NULL,
  method_version text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (country_code, year)
);

ALTER TABLE historical_indicator_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hist_values_read_all" ON historical_indicator_values;
CREATE POLICY "hist_values_read_all" ON historical_indicator_values FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "hist_scores_read_all" ON historical_scores;
CREATE POLICY "hist_scores_read_all" ON historical_scores FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON historical_indicator_values, historical_scores TO anon, authenticated;
