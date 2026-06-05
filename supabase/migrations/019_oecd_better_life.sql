-- Migration 019: OECD Better Life indicators
--
-- Adds two indicators sourced from the OECD Better Life Index 2024:
--   - life_satisfaction       (mental, 0-10 scale, inverted)
--   - work_life_balance       (social, % employed working ≥50 hours/week)
--
-- Source values come from OECD Better Life Index country reports + OECD
-- Employment Database. They are seeded via referenceSeed adapter (annual
-- refresh) rather than fetched live — OECD's SDMX endpoint is unreliable
-- from Vercel runtime, mirroring the IMF Data Mapper experience.
--
-- Brings indicator count to 27 (25 → 27). Mental meta-index gains a
-- subjective wellbeing anchor that complements the clinical signals
-- (depression, anxiety, suicide). Social gains a structural overwork
-- indicator that pairs with loneliness/divorce.

INSERT INTO indicators (
  id, meta_index, name, description, source_org, source_url, unit,
  normalize_low, normalize_high, normalize_invert,
  weight_within_meta, display_order, icon, active
) VALUES

  ('life_satisfaction', 'mental',
    'Life Satisfaction',
    'Average self-reported life satisfaction on a 0-10 ladder (Cantril ladder). The most-tracked subjective wellbeing metric in cross-country comparison. Nordic countries top the rankings (7.4-7.5); South Africa and Türkiye sit near the bottom (4.9-5.7).',
    'OECD Better Life Index 2024', 'https://www.oecdbetterlifeindex.org/', '0-10 scale',
    8, 4, true,  -- INVERTED: 8 → 0 stress, 4 → 100 stress
    1.0, 308, '😊', true),

  ('work_life_balance', 'social',
    'Work-Life Balance',
    'Percentage of dependent employees working very long hours (50+ hours per week). High values indicate structural overwork that erodes family time, leisure, and mental recovery. Korea (26.5%) and Türkiye (28.1%) lead globally; Netherlands and Sweden under 1%.',
    'OECD Employment Database 2024', 'https://www.oecd.org/employment/', '% employees 50h+/week',
    1, 30, false,  -- 1% → 0 stress, 30% → 100 stress
    1.0, 207, '⏱️', true)

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
