-- Migration 008: per-country, per-locale Pulse content
--
-- Extends the existing commentary table (which already stores weekly_pulse +
-- monthly_report articles) to support multiple countries × multiple locales.
-- Adds a pulse_active flag to countries so we can throttle generation to the
-- markets that matter.

-- ── Extend commentary ──

ALTER TABLE commentary
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';

-- Slug is no longer globally unique — it's unique per (country, locale).
-- This lets the same slug ('weekly-pulse-2026-w23') exist for US/en, TR/en, TR/tr.
DROP INDEX IF EXISTS commentary_slug_key;
DROP INDEX IF EXISTS idx_commentary_slug;

ALTER TABLE commentary
  DROP CONSTRAINT IF EXISTS commentary_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commentary_country_locale_slug
  ON commentary(country_code, locale, slug);

CREATE INDEX IF NOT EXISTS idx_commentary_country_locale_date
  ON commentary(country_code, locale, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_commentary_country_type_date
  ON commentary(country_code, type, published_at DESC);

COMMENT ON COLUMN commentary.country_code IS 'ISO 3166-1 alpha-2 or ''global''. Default global preserves legacy rows.';
COMMENT ON COLUMN commentary.locale IS 'BCP-47 lang code (en, tr, es, de, …). Default en.';

-- ── Extend countries with pulse generation flag ──

ALTER TABLE countries
  ADD COLUMN IF NOT EXISTS pulse_active boolean NOT NULL DEFAULT false;

-- Seed: enable Pulse generation for top 5 markets initially.
-- The PD scheduler loops over pulse_active=true countries every Monday.
UPDATE countries SET pulse_active = true
  WHERE code IN ('US', 'GB', 'DE', 'TR', 'JP');

COMMENT ON COLUMN countries.pulse_active IS 'When true, PD generates a weekly Pulse for this country.';

-- ── View: latest pulse per country + locale ──

CREATE OR REPLACE VIEW v_commentary_latest_per_country
WITH (security_invoker = true) AS
SELECT DISTINCT ON (country_code, locale, type) *
FROM commentary
ORDER BY country_code, locale, type, published_at DESC;

GRANT SELECT ON v_commentary_latest_per_country TO anon, authenticated;
