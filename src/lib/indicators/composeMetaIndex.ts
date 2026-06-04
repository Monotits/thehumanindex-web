/**
 * Meta-Index Composition
 *
 * Given a set of normalized indicator measurements and the indicator registry,
 * compute:
 *   - per-meta-index scores per country (5 per country)
 *   - composite scores per country (weighted average of the 5 meta-indexes)
 *   - confidence (% of indicators that actually have data)
 *
 * Output shape matches the country_composite_scores + meta_index_scores tables.
 */

import { IndicatorRegistryRow, MetaIndex, META_INDEXES } from './types';
import type { NormalizedMeasurement } from './orchestrator';

// Default composite weights across the 5 meta-indexes. Sums to 1.0.
// These can be tuned later as we observe correlations + impact research.
export const DEFAULT_META_WEIGHTS: Record<MetaIndex, number> = {
  economic: 0.25,
  social: 0.20,
  mental: 0.20,
  technological: 0.20,
  environmental: 0.15,
};

export interface MetaIndexComposition {
  metaIndex: MetaIndex;
  value: number | null;       // 0-100, null when no underlying data
  weight: number;
  indicatorsCount: number;
  indicatorsWithData: number;
  rawData: {
    contributors: { indicatorId: string; normalizedValue: number; weight: number }[];
  };
}

export interface CountryComposition {
  countryCode: string;
  compositeValue: number | null;  // 0-100, null when zero meta-indexes have data
  band: 'low' | 'moderate' | 'elevated' | 'high' | 'critical' | null;
  metaIndexesWithData: number;
  metaIndexesTotal: number;
  confidence: number;             // 0-1, fraction of indicators with data
  metaIndexes: MetaIndexComposition[];
}

function scoreToBand(score: number): CountryComposition['band'] {
  if (score <= 25) return 'low';
  if (score <= 45) return 'moderate';
  if (score <= 65) return 'elevated';
  if (score <= 80) return 'high';
  return 'critical';
}

export function composeCountryScores(
  measurements: NormalizedMeasurement[],
  indicators: IndicatorRegistryRow[],
  countryCodes: string[],
  metaWeights: Record<MetaIndex, number> = DEFAULT_META_WEIGHTS
): CountryComposition[] {
  // Index: indicator → meta_index + weight
  const indicatorMeta = new Map<string, { meta: MetaIndex; weight: number }>();
  for (const ind of indicators) {
    indicatorMeta.set(ind.id, { meta: ind.meta_index, weight: ind.weight_within_meta });
  }

  // Index: which indicators belong to each meta-index
  const indicatorsByMeta: Record<MetaIndex, IndicatorRegistryRow[]> = {
    economic: [], social: [], mental: [], technological: [], environmental: [],
  };
  for (const ind of indicators) {
    indicatorsByMeta[ind.meta_index].push(ind);
  }

  // Index measurements by (country, indicator)
  const byCountry = new Map<string, Map<string, NormalizedMeasurement>>();
  for (const m of measurements) {
    if (m.normalizedValue === null) continue;
    if (!byCountry.has(m.countryCode)) byCountry.set(m.countryCode, new Map());
    byCountry.get(m.countryCode)!.set(m.indicatorId, m);
  }

  const out: CountryComposition[] = [];

  for (const countryCode of countryCodes) {
    const countryMeasurements = byCountry.get(countryCode) ?? new Map();

    const metaCompositions: MetaIndexComposition[] = [];
    let totalIndicators = 0;
    let totalWithData = 0;
    let weightedSum = 0;
    let activeWeight = 0;

    for (const meta of META_INDEXES) {
      const memberIndicators = indicatorsByMeta[meta];
      totalIndicators += memberIndicators.length;

      const contributors: MetaIndexComposition['rawData']['contributors'] = [];
      let sum = 0;
      let weightSum = 0;
      let withData = 0;

      for (const ind of memberIndicators) {
        const m = countryMeasurements.get(ind.id);
        if (!m || m.normalizedValue === null) continue;
        withData++;
        const w = ind.weight_within_meta;
        sum += m.normalizedValue * w;
        weightSum += w;
        contributors.push({
          indicatorId: ind.id,
          normalizedValue: m.normalizedValue,
          weight: w,
        });
      }
      totalWithData += withData;

      const value = weightSum > 0 ? Math.round((sum / weightSum) * 10) / 10 : null;
      const composition: MetaIndexComposition = {
        metaIndex: meta,
        value,
        weight: metaWeights[meta],
        indicatorsCount: memberIndicators.length,
        indicatorsWithData: withData,
        rawData: { contributors },
      };
      metaCompositions.push(composition);

      if (value !== null) {
        weightedSum += value * metaWeights[meta];
        activeWeight += metaWeights[meta];
      }
    }

    const metaWithData = metaCompositions.filter(m => m.value !== null).length;
    const compositeValue = activeWeight > 0
      ? Math.round((weightedSum / activeWeight) * 10) / 10
      : null;

    out.push({
      countryCode,
      compositeValue,
      band: compositeValue === null ? null : scoreToBand(compositeValue),
      metaIndexesWithData: metaWithData,
      metaIndexesTotal: 5,
      confidence: totalIndicators > 0
        ? Math.round((totalWithData / totalIndicators) * 100) / 100
        : 0,
      metaIndexes: metaCompositions,
    });
  }

  return out;
}
