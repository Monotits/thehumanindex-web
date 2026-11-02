-- Migration 034 — source refresh for survey indicators (2026-11-02)
--
-- 1. air_pollution now comes from the World Bank API (EN.ATM.PM25.MC.M3,
--    population-weighted mean exposure, IHME GBD 2023) instead of a hand-entered
--    seed with no traceable source.
-- 2. social_trust, loneliness, life_satisfaction re-sourced (see referenceSeed.ts).
-- 3. digital_addiction and automation_exposure deactivated: no citable
--    cross-country source exists for the values that were in the seed
--    (digital addiction: no adult multi-country survey; automation exposure:
--    the seed was a triangulation with no per-value citation). Rather keep the
--    Technological meta-index thin than keep untraceable numbers.
--
-- Effect: every composite moves on the next /api/cron/refresh-v2 run.
-- REVERT (3): UPDATE indicators SET active = true WHERE id IN ('digital_addiction','automation_exposure');

UPDATE indicators SET
  source_org = 'World Bank (IHME GBD 2023 exposure estimates)',
  source_url = 'https://data.worldbank.org/indicator/EN.ATM.PM25.MC.M3',
  description = 'Population-weighted mean annual exposure to fine particulate matter (PM2.5), urban and rural.'
WHERE id = 'air_pollution';

UPDATE indicators SET
  source_org = 'Integrated Values Surveys (EVS/WVS wave 7)',
  source_url = 'https://ourworldindata.org/grapher/self-reported-trust-attitudes'
WHERE id = 'social_trust';

UPDATE indicators SET
  source_org = 'Gallup World Poll 2023',
  source_url = 'https://news.gallup.com/poll/646718/people-worldwide-feel-lonely-lot.aspx',
  description = 'Share of adults who felt loneliness during a lot of the previous day.'
WHERE id = 'loneliness';

UPDATE indicators SET
  source_org = 'World Happiness Report 2026',
  source_url = 'https://worldhappiness.report/',
  description = 'Average self-reported life satisfaction on a 0-10 ladder (Cantril ladder), Gallup World Poll three-year average (WHR 2026: 2023–2025).'
WHERE id = 'life_satisfaction';

UPDATE indicators SET active = false
WHERE id IN ('digital_addiction', 'automation_exposure');
