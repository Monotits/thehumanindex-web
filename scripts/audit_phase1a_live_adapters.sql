-- Phase 1A Audit: Live Adapter Truth Test
--
-- Spot-check sample for Eurostat + World Bank adapters.
-- 3 country samples per indicator, latest reference date.
--
-- The operator then:
--   1. Takes each (country, indicator, raw_value, reference_date) row
--   2. Goes to the cited upstream URL
--   3. Looks up the same indicator for the same country + period
--   4. Records "match" or notes the drift
--
-- Eurostat URLs:
--   https://ec.europa.eu/eurostat/databrowser/view/<dataset>/default/table
--   Datasets: une_rt_a (unemployment_rate, youth_unemployment_rate),
--             demo_find (fertility_rate), ilc_di12 (gini_index)
--
-- World Bank URLs (replace COUNTRY3 and CODE):
--   https://data.worldbank.org/indicator/<CODE>?locations=<COUNTRY3>
--   Examples:
--     SL.UEM.TOTL.ZS — unemployment
--     SL.UEM.1524.ZS — youth unemployment
--     SI.POV.GINI    — gini
--     SP.DYN.TFRT.IN — fertility
--     SH.STA.SUIC.P5 — suicide
--     FP.CPI.TOTL.ZG — inflation
--     NY.GDP.MKTP.KD.ZG — GDP growth
--     SP.DYN.LE00.IN — life expectancy
--     GC.DOD.TOTL.GD.ZS — gov debt
--     EN.GHG.CO2.PC.CE.AR5 — CO2/cap
--     SH.DYN.MORT — under-5 mortality
--     EG.FEC.RNEW.ZS — renewable share
--     SH.ALC.PCAP.LI — alcohol
--     SP.POP.DPND — age dependency
--     SP.ADO.TFRT — adolescent fertility
--     VC.IHR.PSRC.P5 — homicide

-- =============================================================
-- A. Eurostat sample (3 EU+ countries × 4 indicators = 12 rows)
-- =============================================================
WITH eurostat_sample AS (
  SELECT DISTINCT ON (iv.country_code, iv.indicator_id)
    iv.country_code, iv.indicator_id, iv.raw_value, iv.reference_date,
    iv.payload->>'adapter_id' AS adapter_id
  FROM indicator_values iv
  WHERE iv.payload->>'adapter_id' = 'eurostat'
    AND iv.indicator_id IN ('unemployment_rate','youth_unemployment_rate','fertility_rate','gini_index')
    AND iv.country_code IN ('DE','FR','IT')
  ORDER BY iv.country_code, iv.indicator_id, iv.fetched_at DESC
)
SELECT 'EUROSTAT' AS source, * FROM eurostat_sample
ORDER BY country_code, indicator_id;

-- =============================================================
-- B. World Bank sample (5 indicators × 3 sample countries each = 15 rows)
-- =============================================================
WITH wb_sample AS (
  SELECT DISTINCT ON (iv.country_code, iv.indicator_id)
    iv.country_code, iv.indicator_id, iv.raw_value, iv.reference_date,
    iv.payload->>'adapter_id' AS adapter_id
  FROM indicator_values iv
  WHERE iv.payload->>'adapter_id' = 'worldBank'
    AND (
      (iv.indicator_id = 'unemployment_rate'     AND iv.country_code IN ('US','TR','ZA')) OR
      (iv.indicator_id = 'inflation_rate'        AND iv.country_code IN ('TR','AR','US')) OR
      (iv.indicator_id = 'life_expectancy'       AND iv.country_code IN ('JP','NO','IN')) OR
      (iv.indicator_id = 'gov_debt_pct_gdp'      AND iv.country_code IN ('JP','IT','DE')) OR
      (iv.indicator_id = 'co2_per_capita'        AND iv.country_code IN ('US','AE','IN'))
    )
  ORDER BY iv.country_code, iv.indicator_id, iv.fetched_at DESC
)
SELECT 'WORLDBANK' AS source, * FROM wb_sample
ORDER BY indicator_id, country_code;
