# The Human Index — Civilizational Stress Dataset, release 2026-11

Snapshot taken 2026-11-03 (UTC) from https://thehumanindex.org. Methodology: https://thehumanindex.org/methodology. Change log: https://thehumanindex.org/changelog.

The Human Index scores 25 countries from 0 to 100 on civilizational stress (higher = more stress). Up to 29 indicators from public statistics and published surveys (World Bank, Eurostat, OECD, IMF WEO, ERA5 via World Bank CCKP, IHME GBD, Gallup, World Happiness Report, EVS/WVS, DataReportal, WRI Aqueduct and others) are normalized to a 0–100 stress scale against fixed bounds and averaged into five domains, weighted economic 28%, social 22%, mental 22%, technological 11% (half weight while it rests on one indicator) and environmental 17%. Values older than five years are excluded; three-to-five-year-old values count at half weight.

## Files

### thehumanindex-scores.csv — current composite, domains and Live layer (one row per country)

| column | meaning |
|---|---|
| iso2, country, region | country identifiers |
| composite | composite stress score, 0–100 |
| band | low (≤25), moderate (≤45), elevated (≤65), high (≤80), critical (>80) |
| economic, social, mental, technological, environmental | domain scores, 0–100 |
| data_coverage | share of indicator weight with usable data (0–1) |
| composite_date | date of the composite run |
| live_score, live_score_7d | Live layer: recent momentum against the country's own history; 50 = normal |
| live_signals | number of Live signals available |
| live_date | date of the Live run |

### thehumanindex-historical.csv — historical structural index, 2000 onward (one row per country-year)

Rebuilt for every year from the indicators with genuine annual histories at a single source (World Bank Open Data, 16 indicators), carried forward at most five years. Same bounds and weights as the composite; the technological domain has no historical data and is absent.

| column | meaning |
|---|---|
| iso2, year | country and year |
| historical_index | historical structural index, 0–100 |
| economic, social, mental, environmental | domain scores, 0–100 |
| indicators_used | indicators with a value for that country-year |
| indicators_total | indicators in the full composite registry (the historical index can use at most the World Bank subset) |
| method_version | historical index method version |

### snapshot.md — plain-text summary at the time of release

Ranking, domain scores, Live signals and the indicator list with sources.

## Licence and attribution

Derived scores: CC BY-NC 4.0. Raw values from proprietary survey sources (e.g. Gallup, DataReportal) are not redistributed here; they remain under their publishers' terms. Cite as:

> The Human Index (2026-11). Civilizational Stress Dataset, release 2026-11. https://thehumanindex.org

## Caveats

- Most inputs are annual; scores move when publishers release new editions. They describe country-level structural conditions, not individual wellbeing, and are not forecasts.
- Housing affordability is a compiled estimate and counts at half weight.
- Methodology changes are versioned; compare scores only within one version (see the change log).
