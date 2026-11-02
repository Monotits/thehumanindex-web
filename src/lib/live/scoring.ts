/**
 * Live layer scoring — pure functions, no I/O (unit-testable with plain node).
 *
 * Momentum percentile:
 *   1. From a series, build the momentum series m_t = f(x_t, x_{t-lag})
 *      (difference for rates, percent change for levels).
 *   2. The latest m is ranked within all historical m (excluding itself).
 *   3. Percentile (mid-rank for ties) → 0-100. invert flips it when a rise
 *      means LESS stress (e.g. job postings).
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

/** Mid-rank percentile of x within hist, 0-100. */
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
  let pct = percentileRank(latest.value, hist);
  if (opts.invert) pct = 100 - pct;
  return {
    rawValue: round(latest.value, 4),
    stressScore: round(clamp(pct, 0, 100), 1),
    referenceDate: lastDate.slice(0, 10),
    historyN: hist.length,
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
