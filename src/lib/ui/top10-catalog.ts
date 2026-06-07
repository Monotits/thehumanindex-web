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
      'A live ranking of the world\'s most stressed countries by composite civilizational stress score across 5 dimensions and 31 indicators.',
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
      'A live ranking of the world\'s most functional societies by composite civilizational stress score. Updated every 12 hours from public data.',
    subhead: 'Lowest composite stress scores worldwide.',
    source: { kind: 'composite' },
    direction: 'least',
    editorial:
      'Low composite stress does not mean problem-free — every country has hot spots. But on the weighted aggregate of 31 indicators, these are the most functional societies right now.',
  },
  {
    slug: 'countries-with-highest-loneliness',
    title: 'Countries with the highest loneliness in 2026',
    description:
      'Where people report feeling most isolated. Live ranking of 25 countries by loneliness index, sourced from OECD Better Life and supplementary surveys.',
    subhead: 'Population-level loneliness across 25 countries.',
    source: { kind: 'indicator', indicator_id: 'loneliness' },
    direction: 'most',
    editorial:
      'Loneliness is one of the few stress signals that does not move with GDP — wealthy countries can have high loneliness, poor countries can have low loneliness. The pattern reveals something else.',
  },
  {
    slug: 'countries-most-exposed-to-automation',
    title: 'Countries most exposed to AI and automation',
    description:
      'Which workforces face the largest displacement risk from AI and automation. Live ranking sourced from labor-mix exposure models.',
    subhead: 'Workforce composition exposure to AI displacement.',
    source: { kind: 'indicator', indicator_id: 'automation_exposure' },
    direction: 'most',
    editorial:
      'Automation exposure ranks countries by how much of their workforce sits in roles that LLMs and automation are closest to replacing. The economies most exposed are usually the most digitized — a counter-intuitive result of being technologically ahead.',
  },
  {
    slug: 'countries-with-housing-crisis',
    title: 'Countries with the worst housing affordability',
    description:
      'Where housing is most unaffordable relative to local incomes. Live ranking of 25 countries by housing-to-income ratio, sourced from OECD.',
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
    subhead: 'Economic meta-index — weighted across 9 indicators.',
    source: { kind: 'meta', meta_index: 'economic' },
    direction: 'most',
    editorial:
      'Economic meta-index combines unemployment, inflation, sovereign debt, housing affordability, Gini, and four more indicators. It carries the highest weight (25%) in the composite — economic stress is the most immediate pressure surface.',
  },
  {
    slug: 'best-countries-for-mental-health',
    title: 'Best countries for mental health in 2026',
    description:
      'Where population-level mental health holds up best. Live ranking of 25 countries by mental meta-index — lower score = better aggregate wellbeing.',
    subhead: 'Mental meta-index — anxiety, suicide, life satisfaction.',
    source: { kind: 'meta', meta_index: 'mental' },
    direction: 'least',
    editorial:
      'Mental meta-index draws on suicide rate, depression prevalence, anxiety, loneliness, life satisfaction and work-life balance. These countries cluster at the favorable end — though aggregates always hide individuals.',
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
      'Where institutional trust, social cohesion, and civic stability hold up worst. Live ranking of 25 countries on the social meta-index.',
    subhead: 'Social meta-index — trust, cohesion, civic stability.',
    source: { kind: 'meta', meta_index: 'social' },
    direction: 'most',
    editorial:
      'Social stress measures cohesion across institutional trust, homicide, perceived fairness and civic participation. It moves slowly but matters for resilience.',
  },
  {
    slug: 'countries-with-highest-technological-stress',
    title: 'Countries with the highest tech disruption stress',
    description:
      'Where AI, automation, digital displacement and tech-driven anxiety combine worst. Live ranking across 25 tracked countries.',
    subhead: 'Technological meta-index — AI exposure and digital displacement.',
    source: { kind: 'meta', meta_index: 'technological' },
    direction: 'most',
    editorial:
      'The technological meta combines AI job anxiety, automation exposure and digital displacement. Counter-intuitively it ranks the most technologically advanced economies highest — being ahead means more exposed.',
  },
];

export function getTop10Entry(slug: string): Top10Entry | null {
  return TOP_10_CATALOG.find((e) => e.slug === slug) ?? null;
}
