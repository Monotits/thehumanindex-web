-- Migration 007: Meta-Index + Multi-Country Framework
--
-- This is the foundational schema for the Human Index v2 architecture:
--   - Countries as a first-class dimension (one row per tracked country)
--   - Indicators registry as the single source of truth for every metric
--   - Composite scores keyed by country
--   - 5 meta-indexes per composite (economic/social/mental/technological/environmental)
--   - Per-indicator measurements with normalization
--
-- The original 7-domain composite_scores + sub_indexes tables are NOT touched.
-- Both architectures run in parallel until the meta-index version is proven,
-- then the legacy read paths can be deprecated.

-- ── Countries dimension ──

CREATE TABLE IF NOT EXISTS countries (
  code text PRIMARY KEY,                          -- ISO 3166-1 alpha-2
  name text NOT NULL,
  region text,                                    -- 'North America', 'Europe', etc.
  population_2025 bigint,                         -- for reader context
  active boolean NOT NULL DEFAULT false,          -- include in scheduled compute
  data_completeness numeric(3,2),                 -- 0-1, % of indicators with recent data
  flag_emoji text,                                -- for UI display
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Indicators registry ──

CREATE TABLE IF NOT EXISTS indicators (
  id text PRIMARY KEY,                            -- slug, e.g. 'unemployment_rate'
  meta_index text NOT NULL CHECK (meta_index IN ('economic', 'social', 'mental', 'technological', 'environmental')),
  name text NOT NULL,
  description text,
  source_org text,                                -- 'World Bank', 'WHO', 'NASA GISS', etc.
  source_url text,
  unit text,                                      -- '%', 'per 1000', 'µg/m³', etc.
  -- Normalization (raw → 0..100)
  normalize_low numeric,                          -- value mapped to 0 (or 100 if invert=true)
  normalize_high numeric,                         -- value mapped to 100 (or 0 if invert=true)
  normalize_invert boolean NOT NULL DEFAULT false, -- when higher raw = lower stress
  -- Composition weight inside the meta-index (default equal)
  weight_within_meta numeric(3,2) NOT NULL DEFAULT 1.0 CHECK (weight_within_meta >= 0),
  -- Display
  display_order int NOT NULL DEFAULT 100,
  icon text,                                      -- emoji or icon id for cards
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indicators_meta_active
  ON indicators(meta_index, active, display_order);

-- ── Composite scores per country ──

CREATE TABLE IF NOT EXISTS country_composite_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES countries(code),
  score_value numeric(5,2) NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
  band text NOT NULL CHECK (band IN ('low', 'moderate', 'elevated', 'high', 'critical')),
  delta numeric(5,2),                             -- vs previous score for same country
  meta_indexes_with_data int NOT NULL DEFAULT 0,
  meta_indexes_total int NOT NULL DEFAULT 5,
  confidence numeric(3,2),                        -- 0-1, e.g., indicators_with_data / total
  computed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_ccs_country_date
  ON country_composite_scores(country_code, computed_at DESC);

-- ── Meta-index scores ──

CREATE TABLE IF NOT EXISTS meta_index_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_composite_score_id uuid NOT NULL REFERENCES country_composite_scores(id) ON DELETE CASCADE,
  meta_index text NOT NULL CHECK (meta_index IN ('economic', 'social', 'mental', 'technological', 'environmental')),
  value numeric(5,2) CHECK (value >= 0 AND value <= 100),
  weight numeric(3,2) NOT NULL DEFAULT 0.2,        -- composite weight (sum should = 1.0)
  indicators_count int NOT NULL DEFAULT 0,         -- how many indicators feed this meta-index
  indicators_with_data int NOT NULL DEFAULT 0,
  raw_data jsonb,                                  -- breakdown for debugging
  UNIQUE(country_composite_score_id, meta_index)
);

-- ── Per-indicator measurements (append-only audit log) ──

CREATE TABLE IF NOT EXISTS indicator_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES countries(code),
  indicator_id text NOT NULL REFERENCES indicators(id),
  raw_value numeric,                              -- value as published by source
  normalized_value numeric(5,2),                  -- 0-100 after normalization
  reference_date date NOT NULL,                   -- date the data refers to
  fetched_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb                                   -- full source response for audit
);

CREATE INDEX IF NOT EXISTS idx_iv_country_indicator_date
  ON indicator_values(country_code, indicator_id, reference_date DESC);

CREATE INDEX IF NOT EXISTS idx_iv_fetched
  ON indicator_values(fetched_at DESC);

-- ── Views for fast public reads ──

CREATE OR REPLACE VIEW v_country_latest_composite
WITH (security_invoker = true) AS
SELECT DISTINCT ON (country_code) *
FROM country_composite_scores
ORDER BY country_code, computed_at DESC;

CREATE OR REPLACE VIEW v_country_latest_meta_indexes
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.country_composite_score_id,
  m.meta_index,
  m.value,
  m.weight,
  m.indicators_count,
  m.indicators_with_data,
  m.raw_data,
  c.country_code,
  c.computed_at
FROM meta_index_scores m
JOIN v_country_latest_composite c ON c.id = m.country_composite_score_id;

CREATE OR REPLACE VIEW v_country_latest_indicators
WITH (security_invoker = true) AS
SELECT DISTINCT ON (country_code, indicator_id)
  country_code,
  indicator_id,
  raw_value,
  normalized_value,
  reference_date,
  fetched_at
FROM indicator_values
ORDER BY country_code, indicator_id, reference_date DESC, fetched_at DESC;

-- ── RLS ──

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_composite_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_index_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read indicators" ON indicators FOR SELECT USING (true);
CREATE POLICY "Public read country_composite_scores" ON country_composite_scores FOR SELECT USING (true);
CREATE POLICY "Public read meta_index_scores" ON meta_index_scores FOR SELECT USING (true);
CREATE POLICY "Public read indicator_values" ON indicator_values FOR SELECT USING (true);

GRANT SELECT ON countries TO anon, authenticated;
GRANT SELECT ON indicators TO anon, authenticated;
GRANT SELECT ON country_composite_scores TO anon, authenticated;
GRANT SELECT ON meta_index_scores TO anon, authenticated;
GRANT SELECT ON indicator_values TO anon, authenticated;
GRANT SELECT ON v_country_latest_composite TO anon, authenticated;
GRANT SELECT ON v_country_latest_meta_indexes TO anon, authenticated;
GRANT SELECT ON v_country_latest_indicators TO anon, authenticated;

-- ── Seed: 25 initial countries (Phase 1 target list) ──

INSERT INTO countries (code, name, region, flag_emoji, active) VALUES
  ('US', 'United States', 'North America', '🇺🇸', true),
  ('CA', 'Canada', 'North America', '🇨🇦', true),
  ('MX', 'Mexico', 'North America', '🇲🇽', true),
  ('GB', 'United Kingdom', 'Europe', '🇬🇧', true),
  ('DE', 'Germany', 'Europe', '🇩🇪', true),
  ('FR', 'France', 'Europe', '🇫🇷', true),
  ('ES', 'Spain', 'Europe', '🇪🇸', true),
  ('IT', 'Italy', 'Europe', '🇮🇹', true),
  ('NL', 'Netherlands', 'Europe', '🇳🇱', true),
  ('SE', 'Sweden', 'Europe', '🇸🇪', true),
  ('NO', 'Norway', 'Europe', '🇳🇴', true),
  ('PL', 'Poland', 'Europe', '🇵🇱', true),
  ('TR', 'Turkey', 'Europe', '🇹🇷', true),
  ('CH', 'Switzerland', 'Europe', '🇨🇭', true),
  ('JP', 'Japan', 'Asia', '🇯🇵', true),
  ('KR', 'South Korea', 'Asia', '🇰🇷', true),
  ('IN', 'India', 'Asia', '🇮🇳', true),
  ('SG', 'Singapore', 'Asia', '🇸🇬', true),
  ('AU', 'Australia', 'Oceania', '🇦🇺', true),
  ('NZ', 'New Zealand', 'Oceania', '🇳🇿', true),
  ('BR', 'Brazil', 'South America', '🇧🇷', true),
  ('AR', 'Argentina', 'South America', '🇦🇷', true),
  ('ZA', 'South Africa', 'Africa', '🇿🇦', true),
  ('IL', 'Israel', 'Middle East', '🇮🇱', true),
  ('AE', 'UAE', 'Middle East', '🇦🇪', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  flag_emoji = EXCLUDED.flag_emoji,
  active = EXCLUDED.active;

-- ── Seed: 18 indicators across 5 meta-indexes ──

INSERT INTO indicators (id, meta_index, name, description, source_org, source_url, unit, normalize_low, normalize_high, normalize_invert, display_order, icon) VALUES

  -- Economic Stress (101-104)
  ('unemployment_rate', 'economic',
    'Unemployment Rate',
    'Share of the labor force without work but available and seeking employment.',
    'World Bank', 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS', '%',
    2, 12, false, 101, '💼'),

  ('youth_unemployment_rate', 'economic',
    'Youth Unemployment Rate',
    'Unemployment rate among the population aged 15-24.',
    'World Bank', 'https://data.worldbank.org/indicator/SL.UEM.1524.ZS', '%',
    5, 25, false, 102, '🎓'),

  ('gini_index', 'economic',
    'Gini Index',
    'Income inequality (0 = perfect equality, 100 = perfect inequality).',
    'World Bank', 'https://data.worldbank.org/indicator/SI.POV.GINI', 'index',
    25, 55, false, 103, '⚖️'),

  ('housing_affordability', 'economic',
    'Housing Affordability',
    'Median house price relative to median annual income (higher = less affordable).',
    'OECD', 'https://www.oecd.org/housing/data/affordable-housing-database/', 'ratio',
    3, 12, false, 104, '🏠'),

  -- Social Stress (201-204)
  ('fertility_rate', 'social',
    'Fertility Rate',
    'Births per woman; below 2.1 indicates below-replacement fertility.',
    'World Bank', 'https://data.worldbank.org/indicator/SP.DYN.TFRT.IN', 'births/woman',
    2.1, 1.0, true, 201, '👶'),

  ('divorce_rate', 'social',
    'Divorce Rate',
    'Divorces per 1000 population per year.',
    'UN Statistics / national stats', 'https://unstats.un.org/unsd/demographic-social/products/', 'per 1000',
    1.5, 5.0, false, 202, '💔'),

  ('social_trust', 'social',
    'Social Trust',
    'Share of adults who agree that most people can be trusted (higher = healthier).',
    'World Values Survey', 'https://www.worldvaluessurvey.org/', '%',
    70, 20, true, 203, '🤝'),

  ('loneliness', 'social',
    'Loneliness',
    'Share of adults reporting frequent or persistent loneliness.',
    'OECD / Eurobarometer', 'https://www.oecd.org/wise/', '%',
    5, 30, false, 204, '😶'),

  -- Mental Stress (301-304)
  ('depression_prevalence', 'mental',
    'Depression Prevalence',
    'Share of adults living with a depressive disorder.',
    'WHO / IHME', 'https://www.who.int/data/gho/data/themes/mental-health', '%',
    2, 8, false, 301, '🧠'),

  ('anxiety_prevalence', 'mental',
    'Anxiety Prevalence',
    'Share of adults living with an anxiety disorder.',
    'WHO / IHME', 'https://www.who.int/data/gho/data/themes/mental-health', '%',
    3, 10, false, 302, '😰'),

  ('burnout', 'mental',
    'Workplace Burnout',
    'Share of workers reporting frequent burnout symptoms.',
    'Gallup State of the Global Workplace', 'https://www.gallup.com/workplace/', '%',
    30, 70, false, 303, '🪫'),

  ('suicide_rate', 'mental',
    'Suicide Rate',
    'Suicides per 100,000 population per year.',
    'World Bank / WHO', 'https://data.worldbank.org/indicator/SH.STA.SUIC.P5', 'per 100K',
    5, 25, false, 304, '🕯️'),

  -- Technological Stress (401-403)
  ('ai_job_anxiety', 'technological',
    'AI Job Anxiety',
    'Composite signal from social media discourse, survey aggregates, and AI exposure indices.',
    'social_feed + survey data', null, 'index',
    20, 80, false, 401, '🤖'),

  ('screen_time', 'technological',
    'Daily Screen Time',
    'Average hours of screen time per adult per day.',
    'DataReportal Digital Report', 'https://datareportal.com/reports/', 'hours/day',
    3, 8, false, 402, '📱'),

  ('digital_addiction', 'technological',
    'Digital Addiction',
    'Share of adults reporting problematic device use.',
    'Pew Research / Eurostat ICT', null, '%',
    10, 40, false, 403, '🪤'),

  -- Environmental Stress (501-503)
  ('temperature_anomaly', 'environmental',
    'Temperature Anomaly',
    'Annual mean temperature deviation from the 1951-1980 baseline.',
    'NASA GISS GISTEMP', 'https://data.giss.nasa.gov/gistemp/', '°C',
    0, 2.5, false, 501, '🌡️'),

  ('water_stress', 'environmental',
    'Water Stress',
    'Ratio of total water withdrawals to renewable water supply.',
    'WRI Aqueduct', 'https://www.wri.org/aqueduct', '%',
    10, 80, false, 502, '💧'),

  ('air_pollution', 'environmental',
    'Air Pollution (PM2.5)',
    'Mean annual fine particulate matter concentration.',
    'WHO Ambient Air Quality DB', 'https://www.who.int/data/gho/data/themes/air-pollution', 'µg/m³',
    5, 50, false, 503, '🌫️')

ON CONFLICT (id) DO UPDATE SET
  meta_index = EXCLUDED.meta_index,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_org = EXCLUDED.source_org,
  source_url = EXCLUDED.source_url,
  unit = EXCLUDED.unit,
  normalize_low = EXCLUDED.normalize_low,
  normalize_high = EXCLUDED.normalize_high,
  normalize_invert = EXCLUDED.normalize_invert,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;

-- ── Comments ──

COMMENT ON TABLE countries IS 'Countries tracked by The Human Index. active=true means included in scheduled compute.';
COMMENT ON TABLE indicators IS 'Master registry of every metric. meta_index groups them into the 5 consumer-facing stress categories.';
COMMENT ON TABLE country_composite_scores IS 'Per-country composite score for the new meta-index architecture. One row per country per cron run.';
COMMENT ON TABLE meta_index_scores IS 'Per-meta-index sub-score (5 per composite). Weighted into the composite score.';
COMMENT ON TABLE indicator_values IS 'Per-country per-indicator measurements. Append-only audit log; views read latest per pair.';
COMMENT ON VIEW v_country_latest_composite IS 'Latest composite score for each country.';
COMMENT ON VIEW v_country_latest_meta_indexes IS 'Latest 5 meta-index scores for each country.';
COMMENT ON VIEW v_country_latest_indicators IS 'Latest value for each (country, indicator) pair.';
