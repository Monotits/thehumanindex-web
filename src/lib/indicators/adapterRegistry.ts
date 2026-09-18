/**
 * Adapter registry metadata — single source of truth for adapter PRIORITY
 * and display attribution. Import-free on purpose so API routes and pages can
 * use it without pulling the adapter implementations into their bundle.
 *
 * Order = priority. The first adapter in this list that returns a value for a
 * (country, indicator) pair is the PRIMARY measurement that feeds the score.
 * orchestrator.ts, /api/transparency/[country] and the country page all read
 * this list, so "which source was used" is answered the same way everywhere.
 */

export interface AdapterMeta {
  id: string;
  /** Human-readable attribution. null = static seed; fall back to the
   *  indicator catalog's source_org (the seed's upstream publisher). */
  displayName: string | null;
  url: string | null;
  active: boolean;
}

export const ADAPTER_REGISTRY: AdapterMeta[] = [
  { id: 'eurostat',      displayName: 'Eurostat',                   url: 'https://ec.europa.eu/eurostat',            active: true },
  { id: 'imf',           displayName: 'IMF World Economic Outlook', url: 'https://www.imf.org/external/datamapper',  active: true },
  { id: 'worldBank',     displayName: 'World Bank',                 url: 'https://data.worldbank.org',               active: true },
  { id: 'oecdHousing',   displayName: null,                         url: null,                                       active: true },
  { id: 'referenceSeed', displayName: null,                         url: null,                                       active: true },
  // Retired adapters — kept so historical rows still resolve, never primary.
  { id: 'nasaGiss',            displayName: 'NASA GISS', url: 'https://data.giss.nasa.gov/gistemp/', active: false },
  { id: 'socialFeedComputed',  displayName: null,        url: null,                                   active: false },
  { id: 'whoGho',              displayName: 'WHO GHO',   url: 'https://www.who.int/data/gho',         active: false },
];

export const ACTIVE_ADAPTER_IDS: string[] = ADAPTER_REGISTRY.filter(a => a.active).map(a => a.id);

/** Lower = higher priority. Retired / unknown adapters sort last. */
export function adapterPriority(adapterId: string | null | undefined): number {
  if (!adapterId) return 999;
  const idx = ADAPTER_REGISTRY.findIndex(a => a.id === adapterId);
  if (idx === -1) return 999;
  return ADAPTER_REGISTRY[idx].active ? idx : 500 + idx;
}

export function adapterMeta(adapterId: string | null | undefined): AdapterMeta | null {
  if (!adapterId) return null;
  return ADAPTER_REGISTRY.find(a => a.id === adapterId) ?? null;
}
