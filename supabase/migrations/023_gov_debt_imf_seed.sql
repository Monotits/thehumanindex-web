-- Migration 023: gov_debt_pct_gdp source switch to IMF WEO seed
--
-- Phase 1 audit finding CRITICAL: World Bank's GC.DOD.TOTL.GD.ZS
-- (Central government debt) is NULL for Japan (30 years!), Germany,
-- Italy, Argentina, and 8 other countries in our active set. Coverage:
-- 13 / 25 countries.
--
-- This means JP's defining macroeconomic feature (252% debt — highest
-- in the developed world) is invisible in JP's composite. Italy's debt
-- crisis is invisible. AR's high debt is invisible.
--
-- Fix: switch source to IMF World Economic Outlook (WEO) October 2024
-- General Government Gross Debt as % of GDP. Coverage is 25/25 with
-- IMF; values are harmonized General-Government basis (more comparable
-- across countries than the Central-Government WB measure).
--
-- The actual seed values move into referenceSeed.ts (code change in
-- this commit). This migration just updates the source_org/source_url
-- attribution in the indicators registry so transparency endpoint
-- correctly cites IMF WEO instead of WB.

UPDATE indicators
SET source_org = 'IMF World Economic Outlook October 2024',
    source_url = 'https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO',
    description = 'General government gross debt as a share of GDP (IMF WEO October 2024). High debt constrains fiscal space for transition investment and is a structural stress signal. Japan ~252%, Italy ~139%, US ~123% — the high-debt regime is now fully visible across all 25 countries (previously WB lacked coverage for 12).'
WHERE id = 'gov_debt_pct_gdp';

-- Sanity verify:
--   SELECT id, source_org, source_url FROM indicators
--   WHERE id = 'gov_debt_pct_gdp';
