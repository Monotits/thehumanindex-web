-- The Human Index - Supabase Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. composite_scores - Monthly composite and weekly pulse scores
CREATE TABLE composite_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score_type text NOT NULL CHECK (score_type IN ('composite', 'pulse')),
  score_value numeric(5,2) NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
  band text NOT NULL CHECK (band IN ('low', 'moderate', 'elevated', 'high', 'critical')),
  delta numeric(5,2),
  computed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

-- 2. sub_indexes - Individual domain scores
CREATE TABLE sub_indexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_score_id uuid NOT NULL REFERENCES composite_scores(id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (domain IN ('work_risk', 'inequality', 'unrest', 'decay', 'wellbeing', 'policy', 'sentiment')),
  value numeric(5,2) NOT NULL CHECK (value >= 0 AND value <= 100),
  weight numeric(3,2) NOT NULL,
  source_updated_at timestamptz,
  raw_data jsonb
);

-- 3. raw_data_points - Immutable append-only log from external APIs
CREATE TABLE raw_data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  indicator text NOT NULL,
  value numeric,
  text_value text,
  reference_date date NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

-- 4. quiz_results - Individual quiz completions
CREATE TABLE quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text,
  job_title text NOT NULL,
  onet_code text,
  industry text NOT NULL,
  tasks text[] NOT NULL,
  experience_years int NOT NULL,
  education_level text NOT NULL CHECK (education_level IN ('high_school', 'bachelors', 'masters', 'phd', 'other')),
  country text NOT NULL,
  region text,
  age_range text NOT NULL CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  exposure_band text NOT NULL CHECK (exposure_band IN ('low', 'moderate', 'elevated', 'high', 'critical')),
  percentile int NOT NULL CHECK (percentile >= 1 AND percentile <= 100),
  task_breakdown jsonb NOT NULL,
  skill_recommendations jsonb NOT NULL,
  region_context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. commentary - AI-generated analyses
CREATE TABLE commentary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('weekly_pulse', 'monthly_report')),
  title text NOT NULL,
  body_markdown text NOT NULL,
  composite_score_id uuid REFERENCES composite_scores(id),
  published_at timestamptz NOT NULL DEFAULT now(),
  slug text UNIQUE NOT NULL
);

-- 6. job_mapping_cache - Claude API result cache
CREATE TABLE job_mapping_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title_normalized text UNIQUE NOT NULL,
  onet_code text NOT NULL,
  onet_title text NOT NULL,
  exposure_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  hit_count int DEFAULT 1
);

-- 7. monthly_scores — Permanent historical record of monthly composite + domain scores
--    Used for the trend chart on the homepage. One row per month.
CREATE TABLE monthly_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month text NOT NULL UNIQUE,             -- e.g. '2026-03'
  composite numeric(5,2) NOT NULL,
  band text NOT NULL CHECK (band IN ('low', 'moderate', 'elevated', 'high', 'critical')),
  work_risk numeric(5,2),
  inequality numeric(5,2),
  unrest numeric(5,2),
  decay numeric(5,2),
  wellbeing numeric(5,2),
  policy numeric(5,2),
  sentiment numeric(5,2),
  active_domains int NOT NULL DEFAULT 0,
  sources_connected text[] DEFAULT '{}',
  computed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

-- Indexes for performance
CREATE INDEX idx_composite_scores_type_date ON composite_scores(score_type, computed_at DESC);
CREATE INDEX idx_sub_indexes_composite ON sub_indexes(composite_score_id);
CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_country ON quiz_results(country);
CREATE INDEX idx_commentary_slug ON commentary(slug);
CREATE INDEX idx_commentary_type_date ON commentary(type, published_at DESC);
CREATE INDEX idx_job_mapping_cache_title ON job_mapping_cache(job_title_normalized);
CREATE INDEX idx_raw_data_points_source ON raw_data_points(source, reference_date DESC);
CREATE INDEX idx_monthly_scores_month ON monthly_scores(year_month DESC);

-- Row Level Security
ALTER TABLE composite_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE commentary ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_mapping_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- composite_scores: public read
CREATE POLICY "Public read composite_scores" ON composite_scores FOR SELECT USING (true);

-- sub_indexes: public read
CREATE POLICY "Public read sub_indexes" ON sub_indexes FOR SELECT USING (true);

-- raw_data_points: service role only (no public access)
-- No SELECT policy = no public access

-- quiz_results: users can read their own
CREATE POLICY "Users read own quiz_results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);

-- commentary: public read
CREATE POLICY "Public read commentary" ON commentary FOR SELECT USING (true);

-- monthly_scores: public read
CREATE POLICY "Public read monthly_scores" ON monthly_scores FOR SELECT USING (true);

-- job_mapping_cache: no public access (Edge Function uses service role)
-- No SELECT policy = no public access

-- Seed data: Initial composite score for demo
INSERT INTO composite_scores (score_type, score_value, band, delta, computed_at, metadata) VALUES
('composite', 58.40, 'elevated', 2.10, '2026-03-01T00:00:00Z', '{"note": "March 2026 composite"}'),
('pulse', 61.20, 'elevated', 1.80, '2026-03-24T00:00:00Z', '{"note": "Week 13 pulse"}');

-- Seed sub-indexes for the composite score
WITH composite AS (
  SELECT id FROM composite_scores WHERE score_type = 'composite' ORDER BY computed_at DESC LIMIT 1
)
INSERT INTO sub_indexes (composite_score_id, domain, value, weight, source_updated_at) VALUES
((SELECT id FROM composite), 'work_risk', 71.00, 0.25, '2026-03-01T00:00:00Z'),
((SELECT id FROM composite), 'inequality', 48.00, 0.15, '2026-03-01T00:00:00Z'),
((SELECT id FROM composite), 'unrest', 52.00, 0.15, '2026-02-15T00:00:00Z'),
((SELECT id FROM composite), 'decay', 44.00, 0.10, '2026-03-01T00:00:00Z'),
((SELECT id FROM composite), 'wellbeing', 56.00, 0.10, '2026-03-01T00:00:00Z'),
((SELECT id FROM composite), 'policy', 38.00, 0.15, '2026-03-01T00:00:00Z'),
((SELECT id FROM composite), 'sentiment', 62.00, 0.10, '2026-03-20T00:00:00Z');

-- Seed commentary
WITH composite AS (
  SELECT id FROM composite_scores WHERE score_type = 'composite' ORDER BY computed_at DESC LIMIT 1
)
INSERT INTO commentary (type, title, body_markdown, composite_score_id, published_at, slug) VALUES
('weekly_pulse', 'Weekly Pulse: March 24-30, 2026',
'## This Week''s Signal

Our model estimates the Weekly Pulse at **61.2**, up 1.8 points from last week''s reading of 59.4. The index remains in the **ELEVATED** band.

### What Drove the Change

The primary driver was a 3-point increase in the Work Risk sub-index, following Amazon''s announcement of a 3,000-position restructuring tied to internal AI tool deployment. This continues a pattern our model has tracked since Q4 2025: large tech employers accelerating structural workforce changes rather than hiring freezes.

Sentiment also ticked up 4 points as Reddit discussion volume around "AI job replacement" surged 34% week-over-week, with particularly elevated activity in r/cscareerquestions and r/accounting.

### Context

For perspective, the current Pulse reading of 61.2 sits 8 points above the trailing 12-month average of 53.1. The last time the Pulse exceeded 60 for two consecutive weeks was January 2026, following the wave of media-sector AI integrations.',
(SELECT id FROM composite), '2026-03-24T00:00:00Z', 'weekly-pulse-2026-w13');
