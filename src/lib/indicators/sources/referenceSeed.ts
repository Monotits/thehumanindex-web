/**
 * Reference Seed Adapter — annually-refreshed static values
 *
 * Several indicators in our framework come from research reports published
 * once a year (Gallup State of Global Workplace, OECD social surveys,
 * DataReportal Digital Reports, WRI
 * Aqueduct). These don't have live REST APIs we can poll on a daily cron.
 *
 * This adapter bundles the most-recent published values for each (country,
 * indicator) pair as code constants. The cron treats them as live data
 * (returns the same value every run). Refresh manually when new reports
 * land — typically once per year per source.
 *
 * Indicators served:
 *   - water_stress              (WRI Aqueduct 4.0, 2023)
 *   - burnout                   (id kept for URL/history stability; MEASURES Gallup "daily stress", not burnout)
 *   - divorce_rate              (national statistics + UN DYB 2023, per-country years)
 *   - social_trust              (EVS/WVS wave 7 via OWID, 2017–2022)
 *   - loneliness                (Gallup World Poll 2023)
 *   - screen_time               (DataReportal Digital 2025, data Q3 2024)
 *   - depression_prevalence     (IHME GBD 2023, age-standardized)
 *   - anxiety_prevalence        (IHME GBD 2023, age-standardized)
 *   - temperature_anomaly       (Berkeley Earth 2024 per-country)
 *   - life_satisfaction         (World Happiness Report 2026, 2023–2025)
 *   - work_life_balance         (OECD How's Life? 2026, data 2025)
 *   - gov_debt_pct_gdp          (IMF WEO October 2024 — 25-country coverage)
 *
 * Future: replace with live API adapters as upstream sources expose them.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  AdapterHealth,
} from '../types';

type CountrySeed = Record<string, number>;

interface SeedEntry {
  indicatorId: string;
  year: number;
  values: CountrySeed;
  source: string;
  /** Per-country reference years where they differ from `year`. */
  yearByCountry?: Record<string, number>;
}

const SEEDS: SeedEntry[] = [
  // ── water_stress (WRI Aqueduct, score 0-5, converted to % stress) ──
  // Mapping: WRI baseline_water_stress / 5 × 100, then averaged across populated cells
  {
    indicatorId: 'water_stress',
    year: 2023,
    source: 'WRI Aqueduct 4.0',
    values: {
      US: 35, CA: 12, MX: 49, GB: 28, DE: 40, FR: 35, ES: 65, IT: 45,
      NL: 32, SE: 8, NO: 6, PL: 38, TR: 60, CH: 18,
      JP: 18, KR: 50, IN: 70, SG: 70,
      AU: 30, NZ: 15, BR: 22, AR: 30, ZA: 65, IL: 80, AE: 90,
    },
  },

  // ── daily stress among employees (indicator id is still 'burnout') ──
  // Gallup asks: "Did you experience stress during A LOT OF THE DAY yesterday?"
  // That is daily stress, NOT clinical/occupational burnout — the catalog name
  // and description were corrected in migration 029. The id stays 'burnout' so
  // /indicator/burnout URLs and snapshot history survive.
  {
    indicatorId: 'burnout',
    // Gallup State of the Global Workplace 2026 (published Apr 2026; fieldwork
    // Jan–Dec 2025). "X% of employees experienced stress a lot of the previous
    // day", from each country's public country-level-data page on gallup.com
    // (verified 2026-11-02; TR, PL, CA re-checked by hand).
    year: 2025,
    source: 'Gallup State of the Global Workplace 2026',
    values: {
      US: 50, CA: 58, MX: 41, GB: 46, DE: 38, FR: 39, ES: 39, IT: 51,
      NL: 30, SE: 34, NO: 43, PL: 22, TR: 66, CH: 34,
      JP: 39, KR: 39, IN: 28, SG: 43,
      AU: 50, NZ: 45, BR: 45, AR: 41, ZA: 36, IL: 42, AE: 33,
    },
  },

  // ── divorce_rate (crude, per 1000 population, latest official year per country) ──
  {
    indicatorId: 'divorce_rate',
    // Crude divorce rate, divorces per 1,000 total population, latest official
    // year per country (researched 2026-11-02). Sources: CDC NCHS (US, excludes
    // CA/HI/IN/MN/NM), ISTAT (IT), Eurostat (SE, CH), TÜİK 2025 (TR), MHLW 2024
    // final (JP), Statistics Korea 2025 (KR), UN Demographic Yearbook 2023
    // Table 25 (CA, MX, GB, DE, NL, NO, PL, SG), Israel CBS (IL). Computed from
    // official counts ÷ population: ES (INE), AU (ABS), NZ (Stats NZ),
    // BR (IBGE), ZA (Stats SA; upper bound, pop. "exceeded 63m").
    // No official national crude rate: FR (last 2016), IN, AR, AE → omitted.
    // US and IT re-checked by hand.
    year: 2024,
    yearByCountry: {
      CA: 2020, MX: 2022, GB: 2022, DE: 2023, ES: 2025, NL: 2023, NO: 2023,
      PL: 2023, TR: 2025, CH: 2023, KR: 2025, SG: 2022, NZ: 2025, IL: 2022,
    },
    source: 'National statistics offices + UN Demographic Yearbook 2023',
    values: {
      US: 2.3, CA: 1.1, MX: 1.3, GB: 1.3, DE: 1.5, ES: 1.6, IT: 1.3,
      NL: 1.4, SE: 2.1, NO: 1.6, PL: 1.5, TR: 2.3, CH: 1.8,
      JP: 1.55, KR: 1.7, SG: 1.7,
      AU: 1.74, NZ: 1.48, BR: 2.01, ZA: 0.38, IL: 1.6,
    },
  },

  // ── social_trust (% agreeing "most people can be trusted") ──
  {
    indicatorId: 'social_trust',
    // Integrated Values Surveys v4 (EVS + WVS joint wave 7, fieldwork
    // 2017–2022), A165 / WVS7 Q57, "don't know" kept in the denominator, as
    // processed by Our World in Data (ourworldindata.org/grapher/
    // self-reported-trust-attitudes). Dated to the wave close (2022), as OWID
    // and IVS do; wave 8 is not yet released. All 22 values read from the
    // OWID CSV on 2026-11-02. IL (last value 2004), ZA (2014) and AE (never
    // surveyed) have no wave-7 value and were dropped.
    year: 2022,
    source: 'Integrated Values Surveys (EVS/WVS wave 7) via Our World in Data',
    values: {
      US: 37.0, CA: 46.7, MX: 10.5, GB: 43.3, DE: 41.6, FR: 26.3, ES: 41.0, IT: 26.6,
      NL: 57.0, SE: 62.8, NO: 72.1, PL: 24.1, TR: 14.0, CH: 58.5,
      JP: 33.7, KR: 32.9, IN: 16.9, SG: 34.4,
      AU: 48.5, NZ: 56.6, BR: 6.5, AR: 19.2,
    },
  },

  // ── loneliness (% who felt lonely "a lot of the day yesterday") ──
  {
    indicatorId: 'loneliness',
    // Gallup World Poll 2023: "Did you experience the following feelings during
    // a lot of the day yesterday? How about loneliness?" — % yes, 142 countries.
    // Values from Gallup's published map dataset (datawrapper WbKq3 v4, linked
    // from news.gallup.com/poll/646718), all 25 read on 2026-11-02; PL 11%
    // matches the article text.
    year: 2023,
    source: 'Gallup World Poll 2023 (loneliness a lot of yesterday)',
    values: {
      US: 20, CA: 21, MX: 15, GB: 21, DE: 20, FR: 23, ES: 19, IT: 19,
      NL: 14, SE: 14, NO: 14, PL: 11, TR: 30, CH: 13,
      JP: 14, KR: 21, IN: 25, SG: 12,
      AU: 18, NZ: 17, BR: 16, AR: 21, ZA: 24, IL: 19, AE: 27,
    },
  },

  // ── screen_time (avg daily hours per adult, DataReportal Digital 2024) ──
  {
    indicatorId: 'screen_time',
    // DataReportal Digital 2025 Global Overview, slide 70 "Daily time spent
    // using the internet" (internet users 16+, GWI Q3 2024), hours decimal.
    // Last comparable edition: GWI changed its time-spent method in Q4 2024 and
    // Digital 2026 reports a non-comparable WEEKLY "online media" sum instead.
    // All 25 values checked against the chart on 2026-11-02.
    year: 2024,
    source: 'DataReportal Digital 2025 (GWI Q3 2024)',
    values: {
      US: 6.7, CA: 6.1, MX: 7.5, GB: 5.6, DE: 5.5, FR: 5.4, ES: 5.7, IT: 5.7,
      NL: 5.7, SE: 6.0, NO: 5.6, PL: 6.4, TR: 7.2, CH: 5.8,
      JP: 4.2, KR: 5.4, IN: 6.8, SG: 6.6,
      AU: 6.1, NZ: 6.5, BR: 9.2, AR: 8.7, ZA: 9.6, IL: 7.4, AE: 8.0,
    },
  },

  // ── depression_prevalence (% adults with depressive disorder; IHME GBD 2021) ──
  {
    indicatorId: 'depression_prevalence',
    // IHME Global Burden of Disease 2023 (published 2025), estimate year 2023,
    // both sexes, AGE-STANDARDIZED prevalence %, as shown in Our World in Data's
    // "Prevalence of mental disorders" explorer (retrieved from IHME 2026-02-07).
    // All 25 values checked against the table on 2026-11-02. Age-standardized so
    // countries with older populations are comparable. IHME data: non-commercial
    // use with attribution; not exported in bulk.
    year: 2023,
    source: 'IHME Global Burden of Disease 2023 (age-standardized)',
    values: {
      US: 4.62, CA: 3.66, MX: 3.21, GB: 6.80, DE: 4.35, FR: 3.96, ES: 3.95, IT: 2.47,
      NL: 6.21, SE: 4.63, NO: 3.21, PL: 2.66, TR: 5.04, CH: 5.21,
      JP: 3.06, KR: 2.66, IN: 3.71, SG: 1.73,
      AU: 3.98, NZ: 3.43, BR: 3.89, AR: 4.17, ZA: 3.77, IL: 5.01, AE: 4.06,
    },
  },

  // ── anxiety_prevalence (% adults with anxiety disorder; IHME GBD 2021) ──
  {
    indicatorId: 'anxiety_prevalence',
    // IHME Global Burden of Disease 2023 (published 2025), estimate year 2023,
    // both sexes, AGE-STANDARDIZED prevalence %, as shown in Our World in Data's
    // "Prevalence of mental disorders" explorer (retrieved from IHME 2026-02-07).
    // All 25 values checked against the table on 2026-11-02. Age-standardized so
    // countries with older populations are comparable. IHME data: non-commercial
    // use with attribution; not exported in bulk.
    year: 2023,
    source: 'IHME Global Burden of Disease 2023 (age-standardized)',
    values: {
      US: 7.06, CA: 7.39, MX: 7.01, GB: 11.27, DE: 6.37, FR: 9.49, ES: 8.65, IT: 8.76,
      NL: 12.41, SE: 7.54, NO: 9.01, PL: 4.43, TR: 4.98, CH: 8.43,
      JP: 3.33, KR: 5.20, IN: 5.79, SG: 3.22,
      AU: 11.46, NZ: 10.05, BR: 11.58, AR: 9.39, ZA: 6.61, IL: 6.17, AE: 4.60,
    },
  },

  // ── temperature_anomaly (°C vs 1951-1980 baseline; Berkeley Earth 2024 per-country) ──
  // Land-temperature anomaly. Higher = more warming-driven environmental stress.
  // Northern Europe + Russia warm fastest (Arctic amplification); SH countries
  // (BR, AR, AU) warm slowest. UAE/IN/ZA see severe absolute heat but lower
  // anomaly because their baseline was already hot.
  {
    indicatorId: 'temperature_anomaly',
    year: 2024,
    source: 'Berkeley Earth Country Reports 2024',
    values: {
      US: 1.6, CA: 1.9, MX: 1.4,
      GB: 1.5, DE: 1.7, FR: 1.6, ES: 1.5, IT: 1.5,
      NL: 1.7, SE: 2.1, NO: 2.0, PL: 1.9, TR: 1.5, CH: 1.6,
      JP: 1.3, KR: 1.4, IN: 0.9, SG: 1.0,
      AU: 1.5, NZ: 1.0,
      BR: 1.0, AR: 0.8,
      ZA: 1.1, IL: 1.5, AE: 1.3,
    },
  },

  // ── life_satisfaction (Cantril ladder 0-10; inverted in normalize) ──
  {
    indicatorId: 'life_satisfaction',
    // World Happiness Report 2026, Figure 2.1: national average Cantril ladder,
    // Gallup World Poll 2023–2025 three-year average. Values read from Our World
    // in Data's WHR series (grapher/happiness-cantril-ladder, year 2025) on
    // 2026-11-02 and matched to a second WHR 2026 copy to 3 decimals.
    year: 2025,
    source: 'World Happiness Report 2026 (Gallup World Poll 2023–2025)',
    values: {
      US: 6.816, CA: 6.741, MX: 6.972, GB: 6.694, DE: 6.882, FR: 6.586, ES: 6.540, IT: 6.574,
      NL: 7.223, SE: 7.255, NO: 7.242, PL: 6.768, TR: 5.300, CH: 7.018,
      JP: 6.130, KR: 6.040, IN: 4.536, SG: 6.585,
      AU: 6.916, NZ: 6.995, BR: 6.634, AR: 6.430, ZA: 5.009, IL: 7.187, AE: 6.821,
    },
  },

  // ── work_life_balance (% employees working ≥50 hours/week, OECD How's Life? 2026) ──
  // Direct stress: higher = worse. Mexico and Türkiye lead; Netherlands and
  // Spain lowest.
  {
    indicatorId: 'work_life_balance',
    // OECD How's Life? 2026 release ("hil2026", WISE Well-being Data Monitor,
    // github.com/wise-oecd/data_monitor, cwb_page/data/latest point data.RDS,
    // measure 2_7 "Long hours in paid work"): % of employees aged 15+ usually
    // working 50+ hours/week. All values read from the file on 2026-11-02.
    // No current OECD value for JP, KR, SG, AE, IN — the previous seed values
    // for them had no traceable source and were dropped rather than kept.
    // Series breaks in 2021 for CH, SE, NL, NO (values not comparable pre-2021).
    year: 2025,
    yearByCountry: { BR: 2024, AR: 2019 },
    source: "OECD How's Life? 2026 (Well-being Data Monitor)",
    values: {
      US: 8.9, CA: 3.13, MX: 24.68,
      GB: 9.06, DE: 2.82, FR: 5.89, ES: 2.23, IT: 2.68,
      NL: 1.84, SE: 4.94, NO: 4.14, PL: 2.84, TR: 23.4, CH: 4.95,
      AU: 9.68, NZ: 11.11,
      BR: 6.26, AR: 15.04,
      ZA: 14.41, IL: 10.43,
    },
  },

  // ── gov_debt_pct_gdp (General gov gross debt, % of GDP, IMF WEO Oct 2024) ──
  // Migration 023 replaces WB GC.DOD.TOTL.GD.ZS which had 12/25 NULL coverage
  // (notably missing JP at 252%, the world's highest). IMF General-Government
  // basis is harmonized across countries. Updates annually each January from
  // the latest WEO database release.
  //
  // Spread: from AE (~28%) to JP (~252%). With normalize bounds 30-200 (post
  // Migration 021), values clamp at 100 stress for JP/SG, register meaningful
  // gradient for everyone else.
  {
    indicatorId: 'gov_debt_pct_gdp',
    year: 2024,
    source: 'IMF World Economic Outlook October 2024',
    values: {
      US: 123, CA: 107, MX: 57,
      GB: 104, DE: 63, FR: 111, ES: 105, IT: 139,
      NL: 47, SE: 33, NO: 44, PL: 49, TR: 28, CH: 38,
      JP: 252, KR: 55, IN: 83, SG: 173,
      AU: 49, NZ: 46,
      BR: 88, AR: 91,
      ZA: 75, IL: 64, AE: 28,
    },
  },
];

const PROVIDED_INDICATORS = new Set(SEEDS.map(s => s.indicatorId));

/** Edition metadata (no values) for disclosure / update tracking. */
export const SEED_EDITIONS: { indicatorId: string; source: string; year: number }[] =
  SEEDS.map(s => ({ indicatorId: s.indicatorId, source: s.source, year: s.year }));

export const referenceSeedAdapter: IndicatorAdapter = {
  id: 'referenceSeed',
  name: 'Reference Seed (annual reports)',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds }) {
    const startedAt = Date.now();
    const wanted = new Set(indicatorIds.filter(id => PROVIDED_INDICATORS.has(id)));
    if (wanted.size === 0 || countries.length === 0) {
      return {
        measurements: [],
        health: {
          adapter: this.id,
          status: 'ok',
          countriesRequested: countries.length,
          countriesReturned: 0,
          indicatorsRequested: 0,
          measurementsReturned: 0,
          durationMs: Date.now() - startedAt,
          error: null,
        },
      };
    }

    const measurements: IndicatorMeasurement[] = [];
    const countriesReturned = new Set<string>();

    for (const seed of SEEDS) {
      if (!wanted.has(seed.indicatorId)) continue;
      for (const c of countries) {
        const v = seed.values[c.code];
        if (v === undefined) continue;
        countriesReturned.add(c.code);
        measurements.push({
          countryCode: c.code,
          indicatorId: seed.indicatorId,
          rawValue: v,
          referenceDate: `${seed.yearByCountry?.[c.code] ?? seed.year}-12-31`,
          payload: { source: seed.source, year: seed.yearByCountry?.[c.code] ?? seed.year },
        });
      }
    }

    const status: AdapterHealth['status'] = measurements.length === 0 ? 'failed' : 'ok';

    return {
      measurements,
      health: {
        adapter: this.id,
        status,
        countriesRequested: countries.length,
        countriesReturned: countriesReturned.size,
        indicatorsRequested: wanted.size,
        measurementsReturned: measurements.length,
        durationMs: Date.now() - startedAt,
        error: null,
      },
    };
  },
};
