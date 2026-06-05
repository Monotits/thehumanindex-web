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
 *   - burnout                   (Gallup State of the Global Workplace 2024)
 *   - divorce_rate              (UN Stats Yearbook + OECD Family DB 2023)
 *   - social_trust              (World Values Survey wave 7 + Edelman Trust 2024)
 *   - loneliness                (OECD Better Life Index + Eurobarometer 2023)
 *   - screen_time               (DataReportal Digital Report 2024)
 *   - digital_addiction         (Pew Research + Eurostat ICT 2023)
 *   - depression_prevalence     (IHME GBD 2021)
 *   - anxiety_prevalence        (IHME GBD 2021)
 *   - temperature_anomaly       (Berkeley Earth 2024 per-country)
 *   - automation_exposure       (McKinsey Global Institute 2023)
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

  // ── burnout (Gallup State of the Global Workplace 2024, % engaged inverted) ──
  // We use "daily stress at work" % from Gallup — higher is worse.
  {
    indicatorId: 'burnout',
    year: 2024,
    source: 'Gallup State of the Global Workplace 2024',
    values: {
      US: 49, CA: 47, MX: 47, GB: 39, DE: 38, FR: 44, ES: 42, IT: 38,
      NL: 31, SE: 32, NO: 32, PL: 41, TR: 56, CH: 30,
      JP: 35, KR: 38, IN: 35, SG: 38,
      AU: 44, NZ: 42, BR: 41, AR: 40, ZA: 50, IL: 52, AE: 41,
    },
  },

  // ── divorce_rate (per 1000 population, UN + OECD Family DB 2023) ──
  {
    indicatorId: 'divorce_rate',
    year: 2023,
    source: 'UN Demographic Yearbook + OECD Family Database',
    values: {
      US: 2.3, CA: 2.0, MX: 1.5, GB: 1.8, DE: 1.7, FR: 1.9, ES: 1.9, IT: 1.5,
      NL: 1.9, SE: 2.5, NO: 1.9, PL: 1.5, TR: 1.8, CH: 1.9,
      JP: 1.5, KR: 2.0, IN: 0.1, SG: 1.7,
      AU: 2.1, NZ: 1.9, BR: 1.6, AR: 1.0, ZA: 0.6, IL: 1.8, AE: 1.7,
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
    year: 2024,
    source: 'DataReportal Digital 2024',
    values: {
      US: 7.0, CA: 6.5, MX: 8.4, GB: 6.0, DE: 5.4, FR: 5.7, ES: 6.3, IT: 6.0,
      NL: 5.5, SE: 5.8, NO: 6.0, PL: 6.5, TR: 7.5, CH: 5.5,
      JP: 4.2, KR: 5.8, IN: 7.3, SG: 6.7,
      AU: 6.1, NZ: 6.0, BR: 9.1, AR: 9.7, ZA: 9.2, IL: 7.2, AE: 7.5,
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
];

const PROVIDED_INDICATORS = new Set(SEEDS.map(s => s.indicatorId));

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
          referenceDate: `${seed.year}-12-31`,
          payload: { source: seed.source, year: seed.year },
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
