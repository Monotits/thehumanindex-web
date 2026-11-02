/**
 * Reference Seed Adapter — annually-refreshed static values
 *
 * Several indicators in our framework come from research reports published
 * once a year (Gallup State of Global Workplace, OECD social surveys,
 * DataReportal Digital Reports, WHO Ambient Air Quality Database, WRI
 * Aqueduct). These don't have live REST APIs we can poll on a daily cron.
 *
 * This adapter bundles the most-recent published values for each (country,
 * indicator) pair as code constants. The cron treats them as live data
 * (returns the same value every run). Refresh manually when new reports
 * land — typically once per year per source.
 *
 * Indicators served:
 *   - water_stress              (WRI Aqueduct 4.0, 2023)
 *   - air_pollution             (WHO Ambient Air Quality DB 2024)
 *   - burnout                   (id kept for URL/history stability; MEASURES Gallup "daily stress", not burnout)
 *   - divorce_rate              (national statistics + UN DYB 2023, per-country years)
 *   - social_trust              (World Values Survey wave 7 + Edelman Trust 2024)
 *   - loneliness                (OECD Better Life Index + Eurobarometer 2023)
 *   - screen_time               (DataReportal Digital Report 2024)
 *   - digital_addiction         (Pew Research + Eurostat ICT 2023)
 *   - depression_prevalence     (IHME GBD 2021)
 *   - anxiety_prevalence        (IHME GBD 2021)
 *   - temperature_anomaly       (Berkeley Earth 2024 per-country)
 *   - automation_exposure       (McKinsey Global Institute 2023)
 *   - life_satisfaction         (OECD Better Life Index 2024)
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

  // ── air_pollution (WHO Ambient Air Quality 2024, annual mean PM2.5 µg/m³) ──
  {
    indicatorId: 'air_pollution',
    year: 2024,
    source: 'WHO Ambient Air Quality Database 2024',
    values: {
      US: 8.4, CA: 7.3, MX: 20.7, GB: 9.6, DE: 11.2, FR: 11.5, ES: 9.7, IT: 16.8,
      NL: 11.4, SE: 5.6, NO: 6.0, PL: 22.4, TR: 27.4, CH: 9.2,
      JP: 9.5, KR: 18.5, IN: 53.3, SG: 11.0,
      AU: 7.1, NZ: 6.0, BR: 14.0, AR: 14.2, ZA: 24.1, IL: 16.4, AE: 38.0,
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

  // ── social_trust (% trusting "most people", World Values Survey wave 7 + Edelman) ──
  {
    indicatorId: 'social_trust',
    year: 2023,
    source: 'World Values Survey wave 7 + Edelman Trust Barometer',
    values: {
      US: 37, CA: 45, MX: 14, GB: 42, DE: 45, FR: 26, ES: 35, IT: 26,
      NL: 64, SE: 63, NO: 72, PL: 24, TR: 12, CH: 56,
      JP: 36, KR: 28, IN: 17, SG: 44,
      AU: 47, NZ: 58, BR: 7, AR: 18, ZA: 24, IL: 33, AE: 27,
    },
  },

  // ── loneliness (% reporting frequent loneliness; OECD + Eurobarometer 2023) ──
  {
    indicatorId: 'loneliness',
    year: 2023,
    source: 'OECD Better Life + Eurobarometer Loneliness Survey',
    values: {
      US: 22, CA: 18, MX: 12, GB: 21, DE: 19, FR: 18, ES: 17, IT: 16,
      NL: 14, SE: 18, NO: 16, PL: 20, TR: 24, CH: 14,
      JP: 23, KR: 26, IN: 8, SG: 19,
      AU: 17, NZ: 15, BR: 13, AR: 17, ZA: 20, IL: 19, AE: 16,
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

  // ── digital_addiction (% reporting problematic device use; Pew + Eurostat) ──
  {
    indicatorId: 'digital_addiction',
    year: 2023,
    source: 'Pew Research + Eurostat ICT Surveys',
    values: {
      US: 31, CA: 28, MX: 28, GB: 30, DE: 24, FR: 25, ES: 27, IT: 28,
      NL: 22, SE: 20, NO: 22, PL: 25, TR: 35, CH: 21,
      JP: 21, KR: 33, IN: 30, SG: 29,
      AU: 27, NZ: 25, BR: 32, AR: 30, ZA: 28, IL: 28, AE: 33,
    },
  },

  // ── depression_prevalence (% adults with depressive disorder; IHME GBD 2021) ──
  {
    indicatorId: 'depression_prevalence',
    year: 2021,
    source: 'IHME Global Burden of Disease 2021',
    values: {
      US: 4.6, CA: 4.7, MX: 4.0, GB: 3.9, DE: 3.6, FR: 4.5, ES: 4.1, IT: 4.0,
      NL: 4.6, SE: 3.6, NO: 3.7, PL: 3.4, TR: 4.4, CH: 3.6,
      JP: 2.7, KR: 3.4, IN: 3.5, SG: 3.0,
      AU: 4.5, NZ: 4.3, BR: 5.6, AR: 5.5, ZA: 4.6, IL: 3.6, AE: 3.4,
    },
  },

  // ── anxiety_prevalence (% adults with anxiety disorder; IHME GBD 2021) ──
  {
    indicatorId: 'anxiety_prevalence',
    year: 2021,
    source: 'IHME Global Burden of Disease 2021',
    values: {
      US: 6.6, CA: 6.0, MX: 4.4, GB: 5.4, DE: 5.0, FR: 5.7, ES: 5.5, IT: 5.2,
      NL: 5.9, SE: 4.6, NO: 4.7, PL: 4.2, TR: 5.9, CH: 5.0,
      JP: 4.0, KR: 4.0, IN: 4.3, SG: 4.2,
      AU: 6.4, NZ: 6.1, BR: 9.3, AR: 7.6, ZA: 5.5, IL: 4.8, AE: 5.6,
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

  // ── automation_exposure (% work activities automatable by 2030) ──
  // Triangulated from McKinsey "Generative AI and the future of work" (2023),
  // OECD AI Country Dashboard, and PwC AI sector studies. Heavy-service +
  // digitized economies (KR, AE, SG, TR) score highest; agrarian/informal
  // labor markets (IN, BR, ZA) lowest.
  {
    indicatorId: 'automation_exposure',
    year: 2023,
    source: 'McKinsey Global Institute / OECD AI Dashboard / PwC',
    values: {
      US: 30, CA: 28, MX: 26,
      GB: 30, DE: 28, FR: 30, ES: 28, IT: 27,
      NL: 28, SE: 27, NO: 26, PL: 30, TR: 32, CH: 25,
      JP: 27, KR: 33, IN: 21, SG: 32,
      AU: 27, NZ: 25,
      BR: 24, AR: 26,
      ZA: 25, IL: 30, AE: 33,
    },
  },

  // ── life_satisfaction (Cantril ladder 0-10, OECD Better Life 2024) ──
  // Nordic countries top the rankings (7.4-7.5); East Asia mid-low; ZA at
  // floor (4.9). Inverted in normalize: high = low stress, low = high stress.
  {
    indicatorId: 'life_satisfaction',
    year: 2024,
    source: 'OECD Better Life Index 2024',
    values: {
      US: 6.7, CA: 7.0, MX: 6.5,
      GB: 6.8, DE: 6.8, FR: 6.6, ES: 6.5, IT: 6.3,
      NL: 7.1, SE: 7.4, NO: 7.3, PL: 6.1, TR: 5.7, CH: 7.4,
      JP: 5.9, KR: 5.8, IN: 4.0, SG: 6.5,
      AU: 7.1, NZ: 7.0,
      BR: 6.1, AR: 6.0,
      ZA: 4.9, IL: 7.1, AE: 6.7,
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
