/**
 * Annual survey / report indicators ("reference seeds"): which edition we
 * use, how often the publisher releases, and whether a newer edition is
 * likely out. Values themselves live in referenceSeed.ts / oecdHousing.ts.
 */

import { SEED_EDITIONS } from '../indicators/sources/referenceSeed';

export const SEED_ADAPTERS = new Set(['referenceSeed', 'oecdHousing']);

type Cadence = { kind: 'annual'; usually?: string } | { kind: 'semiannual'; usually: string } | { kind: 'irregular'; note?: string };

/** Publisher release pattern, per indicator. */
const CADENCE: Record<string, Cadence> = {
  burnout: { kind: 'annual', usually: 'mid-year' },                 // Gallup State of the Global Workplace
  screen_time: { kind: 'irregular', note: 'metric discontinued after Digital 2025 (GWI method change); last comparable edition in use' },
  gov_debt_pct_gdp: { kind: 'semiannual', usually: 'April & October' }, // IMF WEO
  temperature_anomaly: { kind: 'annual', usually: 'January' },      // Berkeley Earth
  divorce_rate: { kind: 'annual' },                                 // UN Demographic Yearbook
  work_life_balance: { kind: 'annual' },                            // OECD Employment Database
  social_trust: { kind: 'irregular', note: 'WVS waves ~5 years; Edelman annual (January)' },
  life_satisfaction: { kind: 'irregular', note: 'OECD Better Life Index' },
  loneliness: { kind: 'irregular' },
  digital_addiction: { kind: 'irregular' },
  depression_prevalence: { kind: 'irregular', note: 'IHME GBD rounds every few years' },
  anxiety_prevalence: { kind: 'irregular', note: 'IHME GBD rounds every few years' },
  water_stress: { kind: 'irregular', note: 'WRI Aqueduct versions' },
  air_pollution: { kind: 'irregular' },
  automation_exposure: { kind: 'irregular' },
};

export interface SeedEditionRow {
  indicatorId: string;
  source: string;
  year: number;
  cadence: string;
  /** A newer edition has very likely been published and we haven't updated yet. */
  updateDue: boolean;
}

/** Seeds now served by a live/snapshot adapter (the seed is only a fallback). */
export const SEEDS_REPLACED: Record<string, string> = {
  gov_debt_pct_gdp: 'IMF WEO, refreshed daily',
  temperature_anomaly: 'ERA5 via World Bank CCKP, refreshed daily',
};

export function seedEditionRows(now = new Date()): SeedEditionRow[] {
  const y = now.getUTCFullYear();
  return SEED_EDITIONS.filter(e => !SEEDS_REPLACED[e.indicatorId]).map(e => {
    const c = CADENCE[e.indicatorId] ?? { kind: 'irregular' as const };
    const cadence = c.kind === 'annual' ? `Annual${c.usually ? ` (usually ${c.usually})` : ''}`
      : c.kind === 'semiannual' ? `Twice a year (${c.usually})`
      : `Irregular${c.note ? ` — ${c.note}` : ''}`;
    // Annual/semiannual sources two or more editions behind are flagged.
    const updateDue = (c.kind === 'annual' || c.kind === 'semiannual') && y - e.year >= 2;
    return { indicatorId: e.indicatorId, source: e.source, year: e.year, cadence, updateDue };
  }).sort((a, b) => Number(b.updateDue) - Number(a.updateDue) || a.year - b.year);
}

/** Share of a country's composite that comes from seed indicators, plus the edition-year range. */
export function seedShare(
  metaRows: { country_code: string; value: number | null; weight: number; raw_data: { contributors?: { indicatorId: string; normalizedValue: number; weight: number; adapterId?: string; referenceDate?: string }[] } | null }[],
  country: string,
): { share: number; minYear: number | null; maxYear: number | null } | null {
  const rows = metaRows.filter(r => r.country_code === country && r.value !== null && (r.raw_data?.contributors?.length ?? 0) > 0);
  const W = rows.reduce((a, r) => a + Number(r.weight), 0);
  if (W <= 0) return null;
  let total = 0, seed = 0, minYear: number | null = null, maxYear: number | null = null;
  for (const r of rows) {
    const cs = r.raw_data!.contributors!;
    const w = cs.reduce((a, c) => a + c.weight, 0);
    for (const c of cs) {
      const v = (Number(r.weight) / W) * (c.weight / w) * c.normalizedValue;
      total += v;
      const adapter = (c.adapterId ?? '').replace(/^carryforward:/, '');
      if (SEED_ADAPTERS.has(adapter)) {
        seed += v;
        const yr = c.referenceDate ? parseInt(c.referenceDate.slice(0, 4), 10) : NaN;
        if (Number.isFinite(yr)) { minYear = minYear === null ? yr : Math.min(minYear, yr); maxYear = maxYear === null ? yr : Math.max(maxYear, yr); }
      }
    }
  }
  return total > 0 ? { share: seed / total, minYear, maxYear } : null;
}
