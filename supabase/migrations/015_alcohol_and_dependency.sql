-- Migration 015: 2 more WB indicators
--
-- Continuing the WB pipeline expansion. Both indicators are direct API hits
-- with no new infrastructure required — just two map rows added to
-- INDICATOR_TO_WB_CODE plus these registry entries.
--
-- New indicators:
--   - alcohol_consumption_per_capita  (mental — substance-abuse signal)
--   - age_dependency_ratio            (economic — demographic/fiscal burden)

INSERT INTO indicators (
  id, meta_index, name, description, source_org, source_url, unit,
  normalize_low, normalize_high, normalize_invert,
  weight_within_meta, display_order, icon, active
) VALUES

  ('alcohol_consumption_per_capita', 'mental',
    'Alcohol Consumption',
    'Total recorded alcohol consumption per capita (liters of pure alcohol) among the population aged 15+. A coping-mechanism proxy and major contributor to disease burden, family stress, and mortality.',
    'World Bank / WHO Global Health Observatory', 'https://data.worldbank.org/indicator/SH.ALC.PCAP.LI', 'liters/year',
    3, 15, false,  -- 3L → 0 stress, 15L → 100 stress
    1.0, 307, '🍷', true),

  ('age_dependency_ratio', 'economic',
    'Age Dependency Ratio',
    'Total dependents (under-15 and over-64) as a percentage of the working-age population (15-64). High values stress pension systems, healthcare budgets, and the productive economy; low values can signal aging crisis or population collapse.',
    'World Bank', 'https://data.worldbank.org/indicator/SP.POP.DPND', '% of working-age',
    40, 80, false,  -- 40% → 0 stress (balanced), 80% → 100 stress (Japan-tier burden)
    1.0, 108, '👴', true)

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
