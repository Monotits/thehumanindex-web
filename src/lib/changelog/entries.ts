/**
 * Public methodology & data changelog. Newest first. Every change that can
 * move a published number gets an entry. Version = methodology version of
 * the composite; data-only refreshes keep the version.
 */

export type ChangeKind = 'methodology' | 'data' | 'new' | 'fix';

export interface ChangeEntry {
  date: string;          // YYYY-MM-DD
  version: string;       // composite methodology version after the change
  kind: ChangeKind;
  title: string;
  detail: string;
  effect?: string;       // what moved, if anything
}

export const CURRENT_METHOD_VERSION = '2.2';

export const CHANGELOG: ChangeEntry[] = [
  {
    date: '2026-11-02', version: '2.2', kind: 'methodology',
    title: 'Two untraceable indicators retired; four re-sourced',
    detail:
      'Digital addiction and automation exposure are no longer scored: no cross-country source exists for the values we had (no multi-country adult survey of problematic device use; the automation figures were a triangulation without per-country citations). The Technological meta-index now rests on daily screen time until citable measures are found. ' +
      'Air pollution now comes from the World Bank API (PM2.5 population-weighted exposure, IHME GBD 2023) and updates automatically. ' +
      'Life satisfaction: World Happiness Report 2026 (2023–2025 average) instead of OECD Better Life 2024. ' +
      'Loneliness: Gallup World Poll 2023 ("lonely a lot of yesterday"), all 25 countries. ' +
      'Social trust: EVS/WVS wave 7 (fieldwork 2017–2022) via Our World in Data; Israel, South Africa and the UAE have no wave-7 value and were dropped.',
    effect: 'Composite now uses 29 indicators. Scores move on the next daily refresh; the historical index (hsi-3) gains air pollution.',
  },
  {
    date: '2026-11-02', version: '2.1', kind: 'data',
    title: 'Depression and anxiety: IHME GBD 2023',
    detail: 'Age-standardized prevalence from the Global Burden of Disease 2023 round (was GBD 2021). Anxiety values above the 10% normalization bound (e.g. Netherlands 12.4%) score 100.',
  },
  {
    date: '2026-11-02', version: '2.1', kind: 'new',
    title: 'Live layer: geopolitical risk and policy uncertainty',
    detail:
      'Two monthly signals join the live layer: the Caldara–Iacoviello Geopolitical Risk index (22 countries) and the Economic Policy Uncertainty index (14 countries). Scored as momentum of the 3-month average on a log scale against each country’s own history, at 0.75 weight.',
  },
  {
    date: '2026-11-02', version: '2.1', kind: 'data',
    title: 'Survey and report indicators refreshed to their latest editions',
    detail:
      'Daily stress: Gallup State of the Global Workplace 2026 (fieldwork 2025), all 25 countries. ' +
      'Screen time: DataReportal Digital 2025 — the last edition with a comparable daily-internet-time measure (Digital 2026 switched to a weekly media sum). ' +
      "Long working hours: OECD How's Life? 2026 (2025 data) for 20 countries. " +
      'Crude divorce rate: latest official national figures (2020–2025) for 21 countries. ' +
      'Values with no traceable source (long hours for JP, KR, SG, AE, IN; divorce for FR, IN, AR, AE) were removed rather than kept.',
    effect: 'Canada 15th → 10th (daily stress 47% → 58%); Türkiye 47.0 → 48.3; India 13th → 16th. Top five unchanged.',
  },
  {
    date: '2026-11-02', version: '2.1', kind: 'methodology',
    title: 'Government debt and temperature anomaly now update automatically',
    detail:
      'Government debt comes from the IMF World Economic Outlook (completed years only) and temperature anomaly from ERA5 via the World Bank Climate Change Knowledge Portal (latest year minus the 1951–1980 mean). Both are fetched daily; the previous hand-entered values remain as a cross-check.',
    effect: 'Temperature anomalies rose for most countries (e.g. Norway 2.0 → 3.3 °C, Türkiye 1.5 → 2.1 °C).',
  },
  {
    date: '2026-11-02', version: '2.1', kind: 'methodology',
    title: 'Source outages no longer move the composite',
    detail:
      'When a source fails for a day, its indicators keep their most recent value (up to 7 days) instead of dropping out of the score. Static survey values are never carried this way.',
    effect: 'Removes the one-day spikes visible in 90-day charts.',
  },
  {
    date: '2026-11-02', version: '2.1', kind: 'new',
    title: 'Survey dependence disclosed on every country page',
    detail:
      'Each country shows the share of its score that comes from annual surveys and reports, with edition years, and /data-sources lists every edition in use and whether a newer one is due.',
  },
  {
    date: '2026-11-02', version: '2.0', kind: 'new',
    title: 'Historical series since 2000, score drivers, embeds, citations, CSV',
    detail:
      'Historical structural index (World Bank indicators only, carried forward up to 5 years), per-indicator decomposition of each country’s gap to the average, embeddable country cards, APA/BibTeX citations and CSV downloads (derived scores and openly licensed inputs only).',
  },
  {
    date: '2026-11-02', version: '2.0', kind: 'new',
    title: 'Live layer',
    detail:
      'A separate, faster score from monthly unemployment and inflation, daily exchange rates, job postings and disaster alerts, each scaled by the country’s own historical volatility (50 = a normal period). Shown next to the composite, not mixed into it.',
  },
  {
    date: '2026-11-02', version: '2.0', kind: 'fix',
    title: '“Last update” no longer implies fresh data',
    detail:
      'The label showed when the pipeline last ran, not when the data last changed. It now reads “Pipeline checked”, and a release calendar shows when each source publishes next.',
  },
];
