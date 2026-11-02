/**
 * Live layer types.
 *
 * A live adapter returns, per (country, signal), a scored observation:
 * the latest momentum value plus where it sits in the country's own
 * historical distribution. Scoring helpers live in scoring.ts.
 */

export type LiveSignalId =
  | 'unemployment_momentum'
  | 'inflation_momentum'
  | 'fx_pressure'
  | 'job_postings_momentum'
  | 'active_disasters'
  | 'geopolitical_risk'
  | 'policy_uncertainty';

export interface LiveObservation {
  countryCode: string;     // ISO 3166-1 alpha-2 (matches countries.code)
  signalId: LiveSignalId;
  rawValue: number;        // momentum metric
  stressScore: number;     // 0-100
  referenceDate: string;   // 'YYYY-MM-DD' of latest upstream observation
  historyN: number | null; // size of the distribution used (null for event scoring)
  adapterId: string;
  payload?: Record<string, unknown>;
}

export interface LiveAdapterHealth {
  adapter: string;
  status: 'ok' | 'degraded' | 'failed';
  observations: number;
  durationMs: number;
  error: string | null;
}

export interface LiveAdapter {
  readonly id: string;
  readonly signals: readonly LiveSignalId[];
  fetch(input: { countryCodes: string[]; timeoutMs: number; now?: Date }): Promise<{
    observations: LiveObservation[];
    health: LiveAdapterHealth;
  }>;
}

/** A dated numeric series, ascending by date. */
export type Series = { date: string; value: number }[];
