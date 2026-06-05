-- Migration 013: 4 new indicators served by World Bank
--
-- All four use the same WB Open Data pipeline our gini/fertility/etc. already
-- run on. No new adapter required — just two lines added to the WB code's
-- INDICATOR_TO_WB_CODE map (already done in this commit) plus these registry
-- rows.
--
-- New indicators:
--   - gdp_growth_rate           (economic, recession signal)
--   - life_expectancy           (mental — substitute for wellbeing, invert=true)
--   - gov_debt_pct_gdp          (economic, fiscal stress)
--   - co2_per_capita            (environmental, emissions footprint)

INSERT INTO indicators (
  id, meta_index, name, description, source_org, source_url, unit,
  normalize_low, normalize_high, normalize_invert,
  weight_within_meta, display_order, icon, active
) VALUES

  ('gdp_growth_rate', 'economic',
    'GDP Growth Rate',
    'Annual % growth of real gross domestic product. Negative = recession, very high (>8%) often reflects overheating or recovery from a crash.',
    'World Bank', 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG', '%',
    4, -3, true,  -- INVERTED: higher growth = less stress; 4% → 0 stress, -3% → 100
    1.0, 106, '📈', true),

  ('life_expectancy', 'mental',
    'Life Expectancy',
    'Average life expectancy at birth (years). Shorter life expectancy reflects accumulated public-health, mental-health, and lifestyle stresses.',
    'World Bank', 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN', 'years',
    82, 60, true,  -- INVERTED: 82+ years → 0 stress, 60 → 100 (very low)
    1.0, 305, '🫀', true),

  ('gov_debt_pct_gdp', 'economic',
    'Government Debt (% of GDP)',
    'General government gross debt as a share of GDP. Above 90-100% signals fiscal stress, especially in non-reserve-currency countries.',
    'World Bank', 'https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS', '% of GDP',
    30, 150, false,  -- 30% → 0 stress (healthy), 150% → 100 stress (crisis)
    1.0, 107, '🏛️', true),

  ('co2_per_capita', 'environmental',
    'CO₂ Emissions per Capita',
    'Annual CO₂ emissions per person (metric tons). Tracks the country''s climate footprint and dependence on fossil fuels.',
    'World Bank', 'https://data.worldbank.org/indicator/EN.GHG.CO2.PC.CE.AR5', 'tonnes/person',
    2, 20, false,
    1.0, 504, '🏭', true)

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
