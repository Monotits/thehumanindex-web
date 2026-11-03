/**
 * Programmatic Top-10 page catalog.
 *
 * Each entry generates a /top-10/[slug] page that targets a specific
 * high-intent search query. The catalog defines the slug, the SEO
 * metadata (title + description), and the data lens (which indicator
 * or meta-index to sort by, and which direction).
 *
 * Adding a new entry here automatically prerenders a new page via
 * generateStaticParams.
 */

import type { MetaIndex } from './tokens';

export type SortDirection = 'most' | 'least';

export interface Top10Entry {
  /** URL slug — must match the search query the user types. */
  slug: string;
  /** Hero headline shown on the page. */
  title: string;
  /** SEO meta description (140-160 chars sweet spot). */
  description: string;
  /** Short sub-headline below the H1. */
  subhead: string;
  /** Data lens — either a specific indicator id or a meta-index. */
  source:
    | { kind: 'indicator'; indicator_id: string }
    | { kind: 'meta'; meta_index: MetaIndex }
    | { kind: 'composite' };
  /** 'most' = highest stress score first; 'least' = lowest first. */
  direction: SortDirection;
  /** Number of entries (default 10). */
  limit?: number;
  /** Short editorial framing paragraph shown under the ranking. */
  editorial?: string;
}

export const TOP_10_CATALOG: Top10Entry[] = [
  {
    slug: 'most-stressed-countries',
    title: 'The 10 most stressed countries in 2026',
    description:
      'A live ranking of the world\'s most stressed countries by composite civilizational stress score across 5 dimensions and 29 indicators.',
    subhead: 'Composite stress score across 25 tracked countries.',
    source: { kind: 'composite' },
    direction: 'most',
    editorial:
      'Composite stress is a weighted average across economic, social, mental, technological and environmental indicators. Higher score = more population-level pressure.',
  },
  {
    slug: 'least-stressed-countries',
    title: 'The 10 least stressed countries in 2026',
    description:
      'A live ranking of the world\'s most functional societies by composite civilizational stress score. Re-checked daily from public data.',
    subhead: 'Lowest composite stress scores worldwide.',
    source: { kind: 'composite' },
    direction: 'least',
    editorial:
      'Low composite stress does not mean problem-free — every country has hot spots. But on the weighted aggregate of 29 indicators, these are the most functional societies right now.',
  },
  {
    slug: 'countries-with-highest-loneliness',
    title: 'Countries with the highest loneliness in 2026',
    description:
      'Where people report feeling most isolated. Ranking of 25 countries by the share of adults who felt lonely a lot of the previous day (Gallup World Poll 2023).',
    subhead: 'Population-level loneliness across 25 countries.',
    source: { kind: 'indicator', indicator_id: 'loneliness' },
    direction: 'most',
    editorial:
      'Loneliness is one of the few stress signals that does not move with GDP — wealthy countries can have high loneliness, poor countries can have low loneliness. The pattern reveals something else.',
  },
  {
    slug: 'countries-with-housing-crisis',
    title: 'Countries with the worst housing affordability',
    description:
      'Where housing is most unaffordable relative to local incomes. Ranking of 25 countries by a compiled house-price-to-income estimate (OECD, IMF and national statistics; counts at half weight).',
    subhead: 'Housing cost vs. local median income.',
    source: { kind: 'indicator', indicator_id: 'housing_affordability' },
    direction: 'most',
    editorial:
      'Housing affordability hits younger workers and renters first — the headline economic stat that captures whether a country is generationally fair.',
  },
  {
    slug: 'countries-with-highest-economic-stress',
    title: 'Countries with the highest economic stress',
    description:
      'Where unemployment, inflation, debt, and housing pressure combine into the worst macroeconomic environment. Live ranking across 25 countries.',
    subhead: 'Economic meta-index — weighted across 8 indicators.',
    source: { kind: 'meta', meta_index: 'economic' },
    direction: 'most',
    editorial:
      'Economic meta-index combines unemployment, inflation, sovereign debt, housing affordability, Gini and three more indicators. It carries the highest weight (28%) in the composite — economic stress is the most immediate pressure surface.',
  },
  {
    slug: 'best-countries-for-mental-health',
    title: 'Best countries for mental health in 2026',
    description:
      'Where population-level mental health holds up best. Live ranking of 25 countries by mental meta-index — lower score = better aggregate wellbeing.',
    subhead: 'Mental meta-index — depression, anxiety, suicide, life satisfaction.',
    source: { kind: 'meta', meta_index: 'mental' },
    direction: 'least',
    editorial:
      'Mental meta-index draws on depression and anxiety prevalence, suicide rate, daily stress, life satisfaction, life expectancy, under-5 mortality and alcohol use. These countries cluster at the favorable end — though aggregates always hide individuals.',
  },
  {
    slug: 'countries-with-highest-environmental-stress',
    title: 'Countries with the highest environmental stress',
    description:
      'Where climate, air quality, water stress, and emissions converge worst. Live ranking from 25 tracked countries.',
    subhead: 'Environmental meta-index across 5 indicators.',
    source: { kind: 'meta', meta_index: 'environmental' },
    direction: 'most',
    editorial:
      'Environmental stress accumulates over decades. Year-on-year movement is slow, but the static ranking already reveals which countries face the steepest adaptation challenges.',
  },
  {
    slug: 'countries-with-most-social-unrest',
    title: 'Countries with the most social fragmentation',
    description:
      'Where social cohesion holds up worst: interpersonal trust, loneliness, homicide, long working hours and family indicators. Ranking of 25 countries on the social meta-index.',
    subhead: 'Social meta-index — trust, loneliness, safety, time, family.',
    source: { kind: 'meta', meta_index: 'social' },
    direction: 'most',
    editorial:
      'Social stress combines interpersonal trust, loneliness, homicide, long working hours, fertility, adolescent fertility and divorce. It moves slowly but matters for resilience.',
  },
  {
    slug: 'countries-with-highest-technological-stress',
    title: 'Countries with the highest technological stress',
    description:
      'Where people spend the most time online each day (DataReportal 2025). The technological meta-index, at half weight while it rests on one indicator.',
    subhead: 'Technological meta-index — daily time online.',
    source: { kind: 'meta', meta_index: 'technological' },
    direction: 'most',
    editorial:
      'Since November 2026 the technological meta-index rests on a single indicator — average daily time online among internet users — and counts at half weight until a second citable measure exists. Read it as digital saturation, not as AI or automation exposure.',
  },
];

export function getTop10Entry(slug: string): Top10Entry | null {
  return TOP_10_CATALOG.find((e) => e.slug === slug) ?? null;
}
