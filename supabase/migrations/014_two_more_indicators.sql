-- Migration 014: 2 more World Bank indicators
--
-- Continuing to enrich meta-indexes that were sparse:
--   - Mental gains a deep wellbeing signal: under-5 mortality
--   - Environmental gains a green-transition signal: renewable energy share

INSERT INTO indicators (
  id, meta_index, name, description, source_org, source_url, unit,
  normalize_low, normalize_high, normalize_invert,
  weight_within_meta, display_order, icon, active
) VALUES

  ('mortality_rate_under5', 'mental',
    'Child Mortality (Under-5)',
    'Deaths of children under five years per 1,000 live births. A composite signal of healthcare access, maternal health, nutrition, and socioeconomic conditions.',
    'World Bank / UNICEF', 'https://data.worldbank.org/indicator/SH.DYN.MORT', 'per 1,000',
    2, 60, false,
    1.0, 306, '🍼', true),

  ('renewable_energy_pct', 'environmental',
    'Renewable Energy Share',
    'Renewable energy consumption as a share of total final energy consumption. Higher = greener transition; lower = continued fossil-fuel dependence.',
    'World Bank', 'https://data.worldbank.org/indicator/EG.FEC.RNEW.ZS', '%',
    60, 5, true,
    1.0, 505, '🌱', true)

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
