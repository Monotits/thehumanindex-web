/**
 * UI Tokens — programmatic access to design system tokens
 *
 * Used by components that need to compute classes / colors dynamically
 * (e.g., StressBand picks the band class based on score).
 */

// ── Composite score band classification ────────────────────────────

export type StressBand = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

const BAND_THRESHOLDS: Array<[number, StressBand]> = [
  [25, 'low'],
  [45, 'moderate'],
  [65, 'elevated'],
  [80, 'high'],
  [Infinity, 'critical'],
];

export function bandFor(score: number | null | undefined): StressBand | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  for (const [upper, band] of BAND_THRESHOLDS) {
    if (score <= upper) return band;
  }
  return 'critical';
}

export const BAND_LABELS: Record<StressBand, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
  critical: 'Critical',
};

export const BAND_LABELS_TR: Record<StressBand, string> = {
  low: 'Düşük',
  moderate: 'Orta',
  elevated: 'Yüksek',
  high: 'Çok Yüksek',
  critical: 'Kritik',
};

export const BAND_BG_CLASS: Record<StressBand, string> = {
  low:      'band-bg-low',
  moderate: 'band-bg-moderate',
  elevated: 'band-bg-elevated',
  high:     'band-bg-high',
  critical: 'band-bg-critical',
};

export const BAND_TEXT_CLASS: Record<StressBand, string> = {
  low:      'band-text-low',
  moderate: 'band-text-moderate',
  elevated: 'band-text-elevated',
  high:     'band-text-high',
  critical: 'band-text-critical',
};

// ── Meta-index categorical ─────────────────────────────────────────

export type MetaIndex = 'economic' | 'social' | 'mental' | 'technological' | 'environmental';

export const META_INDEXES: MetaIndex[] = [
  'economic',
  'social',
  'mental',
  'technological',
  'environmental',
];

export const META_LABELS: Record<MetaIndex, string> = {
  economic:      'Economic',
  social:        'Social',
  mental:        'Mental',
  technological: 'Technological',
  environmental: 'Environmental',
};

export const META_LABELS_TR: Record<MetaIndex, string> = {
  economic:      'Ekonomik',
  social:        'Sosyal',
  mental:        'Mental',
  technological: 'Teknolojik',
  environmental: 'Çevresel',
};

export const META_WEIGHT: Record<MetaIndex, number> = {
  economic:      0.25,
  social:        0.20,
  mental:        0.20,
  technological: 0.20,
  environmental: 0.15,
};

export const META_TEXT_CLASS: Record<MetaIndex, string> = {
  economic:      'meta-text-economic',
  social:        'meta-text-social',
  mental:        'meta-text-mental',
  technological: 'meta-text-technological',
  environmental: 'meta-text-environmental',
};

export const META_BG_CLASS: Record<MetaIndex, string> = {
  economic:      'meta-bg-economic',
  social:        'meta-bg-social',
  mental:        'meta-bg-mental',
  technological: 'meta-bg-technological',
  environmental: 'meta-bg-environmental',
};

// ── Freshness ──────────────────────────────────────────────────────

export type Freshness = 'fresh' | 'aging' | 'stale' | 'very_stale';

export function freshnessFor(referenceDate: string | Date | null | undefined): Freshness | null {
  if (!referenceDate) return null;
  const d = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (!Number.isFinite(d.getTime())) return null;
  const ageYears = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageYears > 5) return 'very_stale';
  if (ageYears > 3) return 'stale';
  if (ageYears > 2) return 'aging';
  return 'fresh';
}

export const FRESHNESS_LABELS: Record<Freshness, string> = {
  fresh:      'Fresh',
  aging:      'Aging',
  stale:      'Stale',
  very_stale: 'Very stale',
};

export const FRESHNESS_LABELS_TR: Record<Freshness, string> = {
  fresh:      'Güncel',
  aging:      'Eskimekte',
  stale:      'Eski',
  very_stale: 'Çok eski',
};

export const FRESHNESS_COLOR_VAR: Record<Freshness, string> = {
  fresh:      'var(--freshness-fresh)',
  aging:      'var(--freshness-aging)',
  stale:      'var(--freshness-stale)',
  very_stale: 'var(--freshness-very-stale)',
};

// ── Confidence ─────────────────────────────────────────────────────

export type ConfidenceTier = 'verified' | 'reported' | 'rumored';

export const CONFIDENCE_LABELS: Record<ConfidenceTier, string> = {
  verified: 'Verified',
  reported: 'Reported',
  rumored:  'Rumored',
};

export const CONFIDENCE_LABELS_TR: Record<ConfidenceTier, string> = {
  verified: 'Doğrulanmış',
  reported: 'Raporlanmış',
  rumored:  'Söylenti',
};

export const CONFIDENCE_COLOR_VAR: Record<ConfidenceTier, string> = {
  verified: 'var(--confidence-verified)',
  reported: 'var(--confidence-reported)',
  rumored:  'var(--confidence-rumored)',
};

// ── Formatting helpers ─────────────────────────────────────────────

export function formatScore(score: number | null | undefined, decimals = 1): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return '—';
  return score.toFixed(decimals);
}

export function formatDelta(delta: number | null | undefined, decimals = 1): string {
  if (delta === null || delta === undefined || !Number.isFinite(delta)) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(decimals)}`;
}
