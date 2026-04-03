-- Migration: Create monthly_scores table for historical trend data
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS monthly_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month text NOT NULL UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_monthly_scores_month ON monthly_scores(year_month DESC);

ALTER TABLE monthly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read monthly_scores" ON monthly_scores FOR SELECT USING (true);
