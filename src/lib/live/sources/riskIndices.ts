/**
 * Geopolitical risk (Caldara & Iacoviello GPR, country-specific) and
 * economic policy uncertainty (Baker, Bloom & Davis EPU), monthly.
 * Read from data/live/risk-indices.json (GitHub Actions snapshot).
 *
 * Both are text-based indices (share / frequency of newspaper articles), so
 * month-to-month values are noisy and spike-prone: we take the 3-month moving
 * average, LOG it (so changes are relative and spikes don't dominate), and
 * score the 3-month change of that, scaled by the country's own volatility
 * since 2000.
 */

import type { LiveAdapter, LiveObservation, LiveSignalId } from '../types';
import { scoreMomentum, type Point } from '../scoring';
import { normalizePeriod } from '../http';
import snapshot from '../../../../data/live/risk-indices.json';

type Snap = { gpr: Record<string, [string, number][]>; epu: Record<string, [string, number][]> };

const MA = 3, LAG = 3, MIN_HISTORY = 60, MAX_AGE_DAYS = 150;

/** Trailing moving average; exported for tests. */
export function movingAverage(points: Point[], window: number): Point[] {
  const out: Point[] = [];
  for (let i = window - 1; i < points.length; i++) {
    let s = 0;
    for (let k = i - window + 1; k <= i; k++) s += points[k].value;
    out.push({ date: points[i].date, value: s / window });
  }
  return out;
}

const PLAN: { key: 'gpr' | 'epu'; signal: LiveSignalId; label: string }[] = [
  { key: 'gpr', signal: 'geopolitical_risk', label: 'Caldara & Iacoviello GPR' },
  { key: 'epu', signal: 'policy_uncertainty', label: 'Economic Policy Uncertainty' },
];

export const riskIndicesAdapter: LiveAdapter = {
  id: 'riskIndices',
  signals: ['geopolitical_risk', 'policy_uncertainty'],

  async fetch({ countryCodes, now }) {
    const started = Date.now();
    const snap = snapshot as unknown as Snap;
    const observations: LiveObservation[] = [];
    for (const { key, signal, label } of PLAN) {
      for (const cc of countryCodes) {
        const raw = snap[key]?.[cc];
        if (!raw?.length) continue;
        const series = movingAverage(raw.map(([p, v]) => ({ date: normalizePeriod(p), value: v })), MA)
          .filter(p => p.value > 0)
          .map(p => ({ date: p.date, value: Math.log(p.value) }));
        const s = scoreMomentum(series, { lag: LAG, kind: 'diff', minHistory: MIN_HISTORY, maxAgeDays: MAX_AGE_DAYS, now });
        if (!s) continue;
        observations.push({
          countryCode: cc, signalId: signal, rawValue: s.rawValue, stressScore: s.stressScore,
          referenceDate: s.referenceDate, historyN: s.historyN, adapterId: this.id,
          payload: { source: label, z: s.zScore, sigma: s.sigma, latest_3m_avg: Math.round(Math.exp(series[series.length - 1].value) * 1000) / 1000, ma_months: MA, lag_months: LAG },
        });
      }
    }
    return {
      observations,
      health: { adapter: this.id, status: observations.length ? 'ok' : 'failed', observations: observations.length, durationMs: Date.now() - started, error: observations.length ? null : 'empty snapshot (data/live/risk-indices.json)' },
    };
  },
};
