/**
 * OECD Housing Adapter — housing_affordability
 *
 * OECD publishes the House Price-to-Income Ratio for OECD countries via their
 * SDMX-JSON API. Lower is better (more affordable); we normalize so higher
 * ratio → higher stress.
 *
 * Endpoint: https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_KEI@DF_KEI,4.0/...
 *
 * Due to OECD's API complexity, this adapter uses a simpler static fallback
 * approach: it bundles OECD-published HPI/income ratios from the 2024 Housing
 * Affordability report for our 25 active countries. Annual refresh by manual
 * update of the constant table — this is reasonable since OECD publishes once
 * per year.
 *
 * For non-OECD countries (BR, AR, ZA, IL, AE, IN, SG) we use proxy estimates
 * from the IMF Global Housing Watch or mark unavailable.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  CountryRow,
  AdapterHealth,
} from '../types';

const PROVIDED_INDICATORS = new Set(['housing_affordability']);

// Approximate house-price-to-annual-income LEVEL ratios (years of income).
//
// PROVENANCE WARNING: an earlier comment claimed these were "converted" from
// OECD's 2015=100 price-to-income INDEX. That is not possible — an index
// carries no level, so it cannot yield "7.3 years of income". OECD does not
// publish absolute ratios. These numbers are compiled estimates (OECD trends,
// IMF Global Housing Watch, national statistics) with no per-value citation.
// The catalog now says so (migration 029). Replace with a citable level source
// or redefine the indicator before using it in published claims.
//
// Source notes:
//   OECD countries: stats.oecd.org HOUSE_PRICES dataset, real price-to-income
//   BR/AR/ZA/IL/AE/IN/SG: IMF Global Housing Watch + national stats
//
// Higher = less affordable = more economic stress.
const HOUSING_AFFORDABILITY_2024: Record<string, { value: number; year: number }> = {
  US: { value: 5.4, year: 2024 },
  CA: { value: 9.8, year: 2024 },
  MX: { value: 5.0, year: 2024 },
  GB: { value: 8.6, year: 2024 },
  DE: { value: 7.3, year: 2024 },
  FR: { value: 8.5, year: 2024 },
  ES: { value: 7.1, year: 2024 },
  IT: { value: 6.8, year: 2024 },
  NL: { value: 9.2, year: 2024 },
  SE: { value: 8.4, year: 2024 },
  NO: { value: 8.0, year: 2024 },
  PL: { value: 7.2, year: 2024 },
  TR: { value: 9.5, year: 2024 },  // recent housing surge + currency depreciation
  CH: { value: 9.3, year: 2024 },
  JP: { value: 4.6, year: 2024 },
  KR: { value: 9.1, year: 2024 },
  IN: { value: 11.1, year: 2024 }, // urban price-to-income very high
  SG: { value: 14.8, year: 2024 },
  AU: { value: 11.0, year: 2024 },
  NZ: { value: 10.7, year: 2024 },
  BR: { value: 7.8, year: 2024 },
  AR: { value: 6.4, year: 2024 },
  ZA: { value: 5.9, year: 2024 },
  IL: { value: 13.6, year: 2024 },
  AE: { value: 5.5, year: 2024 },
};

export const oecdHousingAdapter: IndicatorAdapter = {
  id: 'oecdHousing',
  name: 'OECD Housing Affordability (price-to-income)',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds }) {
    const startedAt = Date.now();
    const wantHousing = indicatorIds.includes('housing_affordability');
    if (!wantHousing) {
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
    for (const c of countries) {
      const entry = HOUSING_AFFORDABILITY_2024[c.code];
      if (!entry) continue;
      measurements.push({
        countryCode: c.code,
        indicatorId: 'housing_affordability',
        rawValue: entry.value,
        referenceDate: `${entry.year}-12-31`,
        payload: { source: 'Compiled estimate (OECD / IMF GHW / national statistics) — static seed, per-value citation missing', year: entry.year },
      });
    }

    return {
      measurements,
      health: {
        adapter: this.id,
        status: measurements.length === countries.length ? 'ok' : 'degraded',
        countriesRequested: countries.length,
        countriesReturned: measurements.length,
        indicatorsRequested: 1,
        measurementsReturned: measurements.length,
        durationMs: Date.now() - startedAt,
        error: null,
      },
    };
  },
};
