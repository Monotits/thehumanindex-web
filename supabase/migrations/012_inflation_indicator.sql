-- Migration 012: inflation_rate indicator (economic meta-index)
--
-- Adds a 19th indicator powered by IMF Data Mapper. Inflation is a core
-- economic stress signal — sustained high inflation erodes purchasing power,
-- destabilizes savings, and especially hits lower-income households.
--
-- Normalization: 0-2% = healthy (low stress), 15%+ = crisis (max stress).
-- Turkey's recent ~50% would clamp to 100, EU/US ~3% lands at ~7-15.

INSERT INTO indicators (
  id, meta_index, name, description, source_org, source_url, unit,
  normalize_low, normalize_high, normalize_invert,
  weight_within_meta, display_order, icon, active
) VALUES (
  'inflation_rate',
  'economic',
  'Inflation Rate',
  'Annual consumer price inflation (year-on-year % change). Sustained inflation above central-bank targets (typically 2%) is a meaningful economic stress signal.',
  'IMF World Economic Outlook',
  'https://www.imf.org/external/datamapper/PCPIPCH@WEO',
  '%',
  2, 15, false,
  1.0,
  105,
  '💸',
  true
) ON CONFLICT (id) DO UPDATE SET
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

COMMENT ON COLUMN indicators.normalize_low IS 'When invert=false: this raw value maps to 0 (no stress). When invert=true: this maps to 100.';
