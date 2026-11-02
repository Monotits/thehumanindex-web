/**
 * Live layer pipeline: run adapters → compose per-country Live score.
 * Pure orchestration; persistence lives in the cron route.
 */

import type { LiveAdapter, LiveAdapterHealth, LiveObservation } from './types';
import { composeLive } from './scoring';
import { labourPricesAdapter } from './sources/labourPrices';
import { ecbFxAdapter } from './sources/ecbFx';
import { indeedAdapter } from './sources/indeed';
import { gdacsAdapter } from './sources/gdacs';
import { riskIndicesAdapter } from './sources/riskIndices';

export const LIVE_ADAPTERS: LiveAdapter[] = [labourPricesAdapter, ecbFxAdapter, indeedAdapter, gdacsAdapter, riskIndicesAdapter];

/** Fallback weights — the live_signals table is the source of truth. */
export const DEFAULT_SIGNAL_WEIGHTS: Record<string, number> = {
  unemployment_momentum: 1,
  inflation_momentum: 1,
  fx_pressure: 1,
  job_postings_momentum: 1,
  active_disasters: 0.5,
  geopolitical_risk: 0.75,
  policy_uncertainty: 0.75,
};

/** Live score needs at least this many SUBSTANTIVE signals (disasters excluded — see below). */
export const MIN_SIGNALS = 2;

export interface LiveCountryScore {
  countryCode: string;
  liveScore: number | null;
  signalsCount: number;
  contributors: { signal_id: string; stress_score: number; weight: number; raw_value: number; reference_date: string }[];
}

export interface LiveRunResult {
  observations: LiveObservation[];
  health: LiveAdapterHealth[];
  scores: LiveCountryScore[];
}

export async function runLivePipeline(input: {
  countryCodes: string[];
  weights?: Record<string, number>;
  timeoutMs?: number;
  now?: Date;
}): Promise<LiveRunResult> {
  const weights = input.weights ?? DEFAULT_SIGNAL_WEIGHTS;
  const timeoutMs = input.timeoutMs ?? 30_000;

  const results = await Promise.all(LIVE_ADAPTERS.map(async a => {
    const started = Date.now();
    try {
      return await a.fetch({ countryCodes: input.countryCodes, timeoutMs, now: input.now });
    } catch (e) {
      return {
        observations: [] as LiveObservation[],
        health: { adapter: a.id, status: 'failed' as const, observations: 0, durationMs: Date.now() - started, error: (e as Error).message },
      };
    }
  }));

  // Only signals with a registry weight count; an inactive signal (weight absent) is dropped.
  const observations = results.flatMap(r => r.observations).filter(o => weights[o.signalId] !== undefined);
  const health = results.map(r => r.health);

  const scores: LiveCountryScore[] = input.countryCodes.map(cc => {
    const obs = observations.filter(o => o.countryCode === cc);
    const contributors = obs.map(o => ({
      signal_id: o.signalId,
      stress_score: o.stressScore,
      weight: weights[o.signalId] ?? 0,
      raw_value: o.rawValue,
      reference_date: o.referenceDate,
    }));
    // The disaster signal is neutral-by-default (50) for every country, so it
    // must not count toward the minimum — otherwise one real signal + "no
    // disaster" would pass as a Live score.
    const substantive = contributors.filter(c => c.signal_id !== 'active_disasters');
    const liveScore = substantive.length >= MIN_SIGNALS
      ? composeLive(contributors.map(c => ({ signalId: c.signal_id, stressScore: c.stress_score, weight: c.weight })), 1)
      : null;
    return { countryCode: cc, liveScore, signalsCount: contributors.length, contributors };
  });

  return { observations, health, scores };
}

export const DEFAULT_COUNTRY_CODES = [
  'AR', 'AU', 'BR', 'CA', 'FR', 'DE', 'IN', 'IL', 'IT', 'JP', 'MX', 'NL', 'NZ',
  'NO', 'PL', 'SG', 'ZA', 'KR', 'ES', 'SE', 'CH', 'TR', 'AE', 'GB', 'US',
];
