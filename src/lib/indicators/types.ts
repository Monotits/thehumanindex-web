/**
 * Indicator adapter types — the contract every source must implement.
 *
 * Architecture (v2 meta-index framework):
 *
 *   1. Each indicator lives in `indicators` table with metadata (normalize_low,
 *      normalize_high, normalize_invert, meta_index, etc.)
 *   2. Each source-domain (World Bank, OECD, WHO, NASA GISS, …) gets a single
 *      adapter file in src/lib/indicators/sources/ that implements
 *      IndicatorAdapter. The adapter exposes which indicators it provides and
 *      a fetchValues({ countries, indicators }) function that batch-fetches.
 *   3. The orchestrator (src/lib/indicators/orchestrator.ts) maps every active
 *      indicator to its adapter, calls them in parallel, normalizes values,
 *      and returns IndicatorMeasurement[] for persistence.
 *
 * Why this pattern: adding a new indicator with an existing source = an entry
 * in the indicators table and a one-line addition to the adapter's
 * providedIndicators map. Adding a new source = a new adapter file. No changes
 * to the orchestrator.
 */

export type MetaIndex =
  | 'economic'
  | 'social'
  | 'mental'
  | 'technological'
  | 'environmental';

export const META_INDEXES: MetaIndex[] = [
  'economic',
  'social',
  'mental',
  'technological',
  'environmental',
];

/** A single value for one (country, indicator) at a point in time. */
export interface IndicatorMeasurement {
  countryCode: string;          // ISO 3166-1 alpha-2
  indicatorId: string;          // matches indicators.id in Supabase
  rawValue: number;             // original value as published
  referenceDate: string;        // ISO 'YYYY-MM-DD'
  payload?: Record<string, unknown>; // optional raw source response for audit
}

/** Metadata about a single indicator pulled from the registry table. */
export interface IndicatorRegistryRow {
  id: string;
  meta_index: MetaIndex;
  name: string;
  description: string | null;
  source_org: string | null;
  source_url: string | null;
  unit: string | null;
  normalize_low: number | null;
  normalize_high: number | null;
  normalize_invert: boolean;
  weight_within_meta: number;
  display_order: number;
  icon: string | null;
  active: boolean;
}

/** Country registry row. */
export interface CountryRow {
  code: string;
  name: string;
  region: string | null;
  population_2025: number | null;
  active: boolean;
  flag_emoji: string | null;
}

/** Health report for one adapter run. */
export interface AdapterHealth {
  adapter: string;
  status: 'ok' | 'degraded' | 'failed';
  countriesRequested: number;
  countriesReturned: number;
  indicatorsRequested: number;
  measurementsReturned: number;
  durationMs: number;
  error: string | null;
}

/**
 * The contract for any indicator source adapter.
 *
 * An adapter typically wraps one upstream API (e.g., World Bank) and provides
 * one or more indicators that share that API's pattern. fetchValues is
 * expected to handle pagination, rate limits, and per-country resilience
 * (one failed country should not abort the batch).
 */
export interface IndicatorAdapter {
  /** Stable identifier for this adapter, used in logs/health reports. */
  readonly id: string;

  /** Human-readable display name. */
  readonly name: string;

  /**
   * The set of indicator IDs this adapter can fetch. Used by the orchestrator
   * to route registry indicators to the right adapter.
   */
  readonly providedIndicators: ReadonlySet<string>;

  /**
   * Batch-fetch values for the requested (country × indicator) pairs.
   * Implementations should be resilient: a single country or indicator
   * failure must not throw — log a warning and continue.
   */
  fetchValues(input: {
    countries: CountryRow[];
    indicatorIds: string[];           // subset of providedIndicators
    /** Soft timeout in ms; adapter should aim to finish under this. */
    timeoutMs?: number;
  }): Promise<{
    measurements: IndicatorMeasurement[];
    health: AdapterHealth;
  }>;
}

/**
 * Normalize a raw value to a 0-100 stress score using indicator bounds.
 *
 * - If invert is false (default), values >= normalize_high → 100 (max stress),
 *   values <= normalize_low → 0 (no stress).
 * - If invert is true (e.g., fertility rate where lower = more stress),
 *   the mapping flips: normalize_low → 100, normalize_high → 0.
 */
export function normalizeIndicator(
  rawValue: number,
  meta: Pick<IndicatorRegistryRow, 'normalize_low' | 'normalize_high' | 'normalize_invert'>
): number | null {
  const { normalize_low: low, normalize_high: high, normalize_invert: invert } = meta;
  if (low === null || high === null) return null;

  if (invert) {
    const minBound = Math.min(low, high);
    const maxBound = Math.max(low, high);
    const clamped = Math.max(minBound, Math.min(maxBound, rawValue));
    const score = ((maxBound - clamped) / (maxBound - minBound)) * 100;
    return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
  }
  const clamped = Math.max(low, Math.min(high, rawValue));
  const score = ((clamped - low) / (high - low)) * 100;
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}
