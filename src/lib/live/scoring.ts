/**
 * Live layer scoring — pure functions, no I/O (unit-testable with plain node).
 *
 * Momentum score (zero-centred standardisation):
 *   1. From a series, build the momentum series m_t = f(x_t, x_{t-lag})
 *      (difference for rates, percent change for levels).
 *   2. σ = robust dispersion of the historical m (1.4826 × MAD).
 *   3. score = 100 × Φ(m_latest / σ). No change → 50; a one-σ rise → 84;
 *      a one-σ fall → 16. invert flips it when a rise means LESS stress.
 *
 * Why not a plain percentile rank: it is centred on the historical median.
 * Where a series trended for a decade (Spain's unemployment fell from 26% to
 * 10%), "no change" ranks high and reads as stress. Centring on zero keeps
 * "nothing happened" at 50 while still scaling by the country's own volatility.
 */

export type Point = { date: string; value: number };

export type MomentumKind = 'diff' | 'pct';

export function momentumSeries(series: Point[], lag: number, kind: MomentumKind): Point[] {
  const out: Point[] = [];
  for (let i = lag; i < series.length; i++) {
    const cur = series[i].value;
    const prev = series[i - lag].value;
    if (!Number.isFinite(cur) || !Number.isFinite(prev)) continue;
    if (kind === 'pct') {
      if (prev === 0) continue;
      out.push({ date: series[i].date, value: ((cur - prev) / Math.abs(prev)) * 100 });
    } else {
      out.push({ date: series[i].date, value: cur - prev });
    }
  }
  return out;
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 erf approximation, |error| < 1.5e-7). */
export function normCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Robust standard deviation: 1.4826 × median absolute deviation. */
export function robustSigma(values: number[]): number {
  if (values.length === 0) return 0;
  const med = median(values);
  return 1.4826 * median(values.map(v => Math.abs(v - med)));
}

function median(values: number[]): number {
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/** Mid-rank percentile of x within hist, 0-100 (kept for diagnostics). */
export function percentileRank(x: number, hist: number[]): number {
  if (hist.length === 0) return 50;
  let below = 0;
  let equal = 0;
  for (const h of hist) {
    if (h < x) below++;
    else if (h === x) equal++;
  }
  return ((below + 0.5 * equal) / hist.length) * 100;
}

export interface MomentumScore {
  rawValue: number;
  stressScore: number;
  referenceDate: string;
  historyN: number;
  /** Signed so that positive = more stress (already inverted when invert=true). */
  zScore: number;
  sigma: number;
}

export function scoreMomentum(
  series: Point[],
  opts: { lag: number; kind: MomentumKind; invert?: boolean; minHistory: number; maxAgeDays: number; now?: Date }
): MomentumScore | null {
  const sorted = [...series]
    .filter(p => Number.isFinite(p.value))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (sorted.length === 0) return null;
  const now = opts.now ?? new Date();
  const lastDate = sorted[sorted.length - 1].date;
  const ageDays = (now.getTime() - new Date(lastDate).getTime()) / 86_400_000;
  // Too old to be "live", or future-dated (never trust those).
  if (!(ageDays <= opts.maxAgeDays) || ageDays < -1) return null;

  const m = momentumSeries(sorted, opts.lag, opts.kind);
  if (m.length < opts.minHistory + 1) return null;
  const latest = m[m.length - 1];
  const hist = m.slice(0, -1).map(p => p.value);
  const sigma = robustSigma(hist);
  if (!(sigma > 0)) return null; // flat series (e.g. a pegged currency) carries no signal
  const z = latest.value / sigma;
  let score = normCdf(z) * 100;
  if (opts.invert) score = 100 - score;
  return {
    rawValue: round(latest.value, 4),
    stressScore: round(clamp(score, 0, 100), 1),
    referenceDate: lastDate.slice(0, 10),
    historyN: hist.length,
    zScore: round(opts.invert ? -z : z, 3),
    sigma: round(sigma, 4),
  };
}

/** Event scoring for disasters: none = 50, Orange peaks at 75, Red at 100, linear decay to the floor over windowDays. */
export function scoreDisasterEvents(
  events: { alertLevel: 'Green' | 'Orange' | 'Red'; date: string }[],
  opts: { windowDays: number; now?: Date }
): { stressScore: number; rawValue: number; referenceDate: string | null } {
  const now = (opts.now ?? new Date()).getTime();
  let best = 50;
  let bestRaw = 0;
  let ref: string | null = null;
  for (const e of events) {
    const peak = e.alertLevel === 'Red' ? 100 : e.alertLevel === 'Orange' ? 75 : 55;
    const raw = e.alertLevel === 'Red' ? 3 : e.alertLevel === 'Orange' ? 2 : 1;
    const age = (now - new Date(e.date).getTime()) / 86_400_000;
    if (age < -1 || age > opts.windowDays) continue;
    const decay = 1 - Math.max(0, age) / opts.windowDays; // 1 → 0
    const s = 50 + (peak - 50) * decay;
    if (s > best) {
      best = s;
      bestRaw = raw;
      ref = e.date.slice(0, 10);
    }
  }
  return { stressScore: round(best, 1), rawValue: bestRaw, referenceDate: ref };
}

/** Weighted mean of available signal scores. Null when fewer than minSignals. */
export function composeLive(
  scores: { signalId: string; stressScore: number; weight: number }[],
  minSignals = 2
): number | null {
  const usable = scores.filter(s => s.weight > 0 && Number.isFinite(s.stressScore));
  if (usable.length < minSignals) return null;
  const w = usable.reduce((a, s) => a + s.weight, 0);
  if (w === 0) return null;
  return round(usable.reduce((a, s) => a + s.stressScore * s.weight, 0) / w, 1);
}

/** Mean of today's score and up to 6 previous daily scores. */
export function smooth7d(today: number, previous: number[]): number {
  const vals = [today, ...previous.slice(0, 6)].filter(Number.isFinite);
  return round(vals.reduce((a, b) => a + b, 0) / vals.length, 1);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function round(x: number, d: number): number {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}
