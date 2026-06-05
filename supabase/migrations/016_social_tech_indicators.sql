-- Migration 016: 3 new indicators (2 social + 1 technological)
--
-- Brings indicator count to 25 (matching 25 countries — the framework
-- is now symmetric: 25×25 cells across 5 meta-indexes).
--
-- The Social meta-index was the most under-served (only 4 indicators),
-- and Technological had only 2. This migration biases toward both.
--
-- New indicators:
--   - adolescent_fertility_rate   (social, WB SP.ADO.TFRT)
--       Teen pregnancy rate. Strong opportunity-deficit signal in
--       developing economies; low in JP/KR/CH/NL/SG.
--   - homicide_rate               (social, WB VC.IHR.PSRC.P5)
--       Intentional homicides per 100k. Public safety / social
--       cohesion. Latin America 20-50, Japan 0.2, US ~6.
--   - automation_exposure         (technological, McKinsey 2023 seed)
--       % work activities automatable by 2030. Captures AI/automation
--       displacement pressure. Slightly higher in highly-digitized
--       service economies (KR, AE) and lower in agrarian (IN).

INSERT INTO indicators (
  id, meta_index, name, description, source_org, source_url, unit,
  normalize_low, normalize_high, normalize_invert,
  weight_within_meta, display_order, icon, active
) VALUES

  ('adolescent_fertility_rate', 'social',
    'Adolescent Fertility Rate',
    'Births per 1,000 women aged 15-19. A composite signal of educational access, contraceptive availability, and economic opportunity for young women. Persistent high values mark inter-generational poverty traps.',
    'World Bank', 'https://data.worldbank.org/indicator/SP.ADO.TFRT', 'per 1,000 women',
    5, 80, false,  -- 5 → 0 stress (JP/KR/CH territory), 80 → 100 stress (sub-Saharan)
    1.0, 205, '👶', true),

  ('homicide_rate', 'social',
    'Homicide Rate',
    'Intentional homicides per 100,000 population. The most universally collected violence metric — captures social cohesion, rule-of-law, and conflict exposure. Vast range: from 0.2 (JP) to 35+ (parts of Latin America).',
    'World Bank / UNODC', 'https://data.worldbank.org/indicator/VC.IHR.PSRC.P5', 'per 100k',
    1, 30, false,  -- 1 → 0 stress, 30 → 100 stress
    1.0, 206, '⚠️', true),

  ('automation_exposure', 'technological',
    'Automation Exposure',
    'Share of work activities potentially automatable by 2030 (McKinsey Generative AI estimates). Higher = more labour-displacement pressure from AI and automation. Service-heavy economies face higher exposure than agrarian ones.',
    'McKinsey Global Institute 2023', 'https://www.mckinsey.com/mgi/our-research/generative-ai-and-the-future-of-work-in-america', '%',
    18, 35, false,  -- 18% → 0 stress (low exposure), 35% → 100 stress
    1.0, 403, '🤖', true)

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
