-- Migration 029 — indicator labels must describe what is actually measured
-- (Astra audit 2026-09-18, methodology items 2 and 3)
--
-- IDs are unchanged on purpose: /indicator/<id> URLs, indicator_snapshots
-- history and research_articles.related_indicators all key on them.

-- 1. 'burnout' holds Gallup's DAILY STRESS share, not burnout.
--    Gallup item: "Did you experience stress during a lot of the day yesterday?"
UPDATE indicators
SET name        = 'Daily Stress (Employees)',
    description = 'Share of employees who say they experienced stress during a lot of the previous day (Gallup). A daily-emotion measure — not a clinical or occupational burnout diagnosis.',
    source_org  = 'Gallup State of the Global Workplace',
    source_url  = 'https://www.gallup.com/workplace/349484/state-of-the-global-workplace.aspx'
WHERE id = 'burnout';

-- 2. housing_affordability: OECD publishes a 2015=100 price-to-income INDEX,
--    not the absolute "years of income" ratio shown here. The seeded values are
--    compiled estimates without per-value citations — say so.
UPDATE indicators
SET name        = 'Housing Affordability (estimate)',
    description = 'Approximate ratio of a typical home price to annual household income (higher = less affordable). Compiled estimate from OECD, IMF Global Housing Watch and national statistics; not an official OECD series. Treat cross-country differences under ~1 point as noise.',
    source_org  = 'Compiled estimate (OECD / IMF GHW / national statistics)',
    source_url  = 'https://www.oecd.org/en/data/indicators/housing-prices.html'
WHERE id = 'housing_affordability';

-- 3. Content that may now be mislabeled: list it for manual review (no changes).
--    Run separately to see the queue:
--
--    SELECT slug, country_code, title FROM research_articles
--    WHERE status = 'published' AND body_markdown ~* 'burn-?out';
--
--    SELECT slug, country_code, title FROM commentary
--    WHERE body_markdown ~* 'burn-?out' ORDER BY published_at DESC LIMIT 50;
