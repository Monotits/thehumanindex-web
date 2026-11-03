/**
 * Composite decomposition.
 *
 * composite = Σ_m (W_m / ΣW_active) · Σ_i (w_i / Σw_m) · n_i
 * so each indicator's contribution c_i = (W_m / ΣW_active) · (w_i / Σw_m) · n_i
 * and Σ c_i = composite exactly. Comparing c_i with the cross-country mean
 * of c_i splits "composite − average composite" into per-indicator gaps
 * that also sum exactly (an indicator a country lacks contributes 0).
 */

export interface MetaRow {
  country_code: string;
  meta_index: string;
  value: number | null;
  weight: number;
  raw_data: { contributors?: { indicatorId: string; normalizedValue: number; weight: number }[] } | null;
}

export type Contributions = Map<string, number>; // indicatorId → points of composite

export function contributionsByCountry(rows: MetaRow[]): Map<string, Contributions> {
  const byCountry = new Map<string, MetaRow[]>();
  for (const r of rows) {
    if (!byCountry.has(r.country_code)) byCountry.set(r.country_code, []);
    byCountry.get(r.country_code)!.push(r);
  }
  const out = new Map<string, Contributions>();
  for (const [cc, metas] of byCountry) {
    const active = metas.filter(m => m.value !== null && (m.raw_data?.contributors?.length ?? 0) > 0);
    const W = active.reduce((a, m) => a + Number(m.weight), 0);
    const contrib: Contributions = new Map();
    if (W > 0) {
      for (const m of active) {
        const cs = m.raw_data!.contributors!;
        const w = cs.reduce((a, c) => a + c.weight, 0);
        if (w <= 0) continue;
        for (const c of cs) {
          contrib.set(c.indicatorId, (contrib.get(c.indicatorId) ?? 0) + (Number(m.weight) / W) * (c.weight / w) * c.normalizedValue);
        }
      }
    }
    out.set(cc, contrib);
  }
  return out;
}

export interface Gap {
  indicatorId: string;
  contribution: number; // this country's points
  average: number;      // mean points across countries
  gap: number;          // contribution − average
  /** The country has no value for this indicator (its weight went to the others). */
  missing: boolean;
}

export function gapsVsAverage(all: Map<string, Contributions>, country: string): { gaps: Gap[]; total: number; avgComposite: number; composite: number } | null {
  const mine = all.get(country);
  if (!mine || all.size < 2) return null;
  const ids = new Set<string>();
  for (const c of all.values()) for (const id of c.keys()) ids.add(id);
  const n = all.size;
  const gaps: Gap[] = [];
  for (const id of ids) {
    let sum = 0;
    for (const c of all.values()) sum += c.get(id) ?? 0;
    const average = sum / n;
    const contribution = mine.get(id) ?? 0;
    gaps.push({ indicatorId: id, contribution, average, gap: contribution - average, missing: !mine.has(id) });
  }
  const composite = Array.from(mine.values()).reduce((a, b) => a + b, 0);
  let avgComposite = 0;
  for (const c of all.values()) avgComposite += Array.from(c.values()).reduce((a, b) => a + b, 0);
  avgComposite /= n;
  gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  return { gaps, total: composite - avgComposite, avgComposite, composite };
}
