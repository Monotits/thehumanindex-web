/**
 * Topic hub catalog.
 *
 * Topics are user-facing curated lenses ('AI & Jobs', 'Housing',
 * 'Mental Health') that map to one or more underlying meta-indexes
 * and indicators. Each entry defines:
 *   - SEO slug, title, subheading
 *   - The headline indicator (primary signal) for the hub
 *   - Additional related indicators
 *   - The dominant meta-index for the hub
 *   - Pulse keyword hints for related-article matching
 *
 * Adding an entry here automatically generates a new /topics/[slug]
 * page via generateStaticParams.
 */

import type { MetaIndex } from './tokens';

export interface TopicEntry {
  slug: string;
  title: string;
  subhead: string;
  description: string;
  headlineIndicator: string;
  relatedIndicators: string[];
  meta: MetaIndex;
  pulseKeywords: string[];
  emoji: string;
}

export const TOPIC_CATALOG: TopicEntry[] = [
  {
    slug: 'ai-and-jobs',
    title: 'AI & jobs',
    subhead: 'Where automation is reshaping the workforce — and which countries are most exposed.',
    description:
      'Live data on AI displacement, automation exposure, and labor-market disruption across 25 countries. The signals shaping work in 2026 and beyond.',
    headlineIndicator: 'automation_exposure',
    relatedIndicators: ['ai_job_anxiety', 'unemployment_rate'],
    meta: 'technological',
    pulseKeywords: ['ai', 'automation', 'displacement', 'jobs', 'labor', 'workforce'],
    emoji: '🤖',
  },
  {
    slug: 'housing',
    title: 'Housing',
    subhead: 'Where housing affordability is breaking — and where it still holds.',
    description:
      'Live housing affordability and cost-of-living data across 25 countries. Headline ratios, country rankings, and editorial framing.',
    headlineIndicator: 'housing_affordability',
    relatedIndicators: ['gini_index', 'gdp_per_capita_ppp'],
    meta: 'economic',
    pulseKeywords: ['housing', 'rent', 'affordability', 'mortgage', 'real estate'],
    emoji: '🏠',
  },
  {
    slug: 'mental-health',
    title: 'Mental health',
    subhead: 'Anxiety, depression, suicide, loneliness — measured at the population level.',
    description:
      'The mental health signals we track across 25 countries: suicide rate, depression, anxiety, loneliness, life satisfaction.',
    headlineIndicator: 'depression_prevalence',
    relatedIndicators: ['anxiety_prevalence', 'suicide_rate', 'loneliness', 'life_satisfaction'],
    meta: 'mental',
    pulseKeywords: ['mental', 'depression', 'anxiety', 'suicide', 'loneliness', 'wellbeing'],
    emoji: '🧠',
  },
  {
    slug: 'climate',
    title: 'Climate & environment',
    subhead: 'Heat, water stress, emissions, air quality — the accumulating tail risk.',
    description:
      'Environmental stress indicators across 25 countries: temperature anomaly, water stress, air pollution, emissions intensity, renewable share.',
    headlineIndicator: 'temperature_anomaly',
    relatedIndicators: ['water_stress', 'air_pollution_pm25', 'renewables_share'],
    meta: 'environmental',
    pulseKeywords: ['climate', 'temperature', 'air', 'water', 'environment', 'emissions'],
    emoji: '🌡️',
  },
  {
    slug: 'inequality',
    title: 'Inequality',
    subhead: 'How concentrated are wealth and opportunity — and what does that mean for stability.',
    description:
      'Income inequality, wealth concentration, and economic opportunity across 25 countries. Gini coefficients, GDP per capita, and the structural signals behind them.',
    headlineIndicator: 'gini_index',
    relatedIndicators: ['gdp_per_capita_ppp', 'unemployment_rate'],
    meta: 'economic',
    pulseKeywords: ['inequality', 'gini', 'wealth', 'income', 'distribution'],
    emoji: '📊',
  },
  {
    slug: 'social-trust',
    title: 'Social trust & cohesion',
    subhead: 'Institutional trust, civic engagement, and social fabric — measured.',
    description:
      'The social cohesion signals that hold (or fail to hold) societies together: institutional trust, perceived fairness, civic participation, crime.',
    headlineIndicator: 'homicide_rate',
    relatedIndicators: ['adolescent_fertility', 'alcohol_consumption'],
    meta: 'social',
    pulseKeywords: ['trust', 'social', 'cohesion', 'civic', 'unrest', 'institutions'],
    emoji: '🤝',
  },
];

export function getTopicEntry(slug: string): TopicEntry | null {
  return TOPIC_CATALOG.find((e) => e.slug === slug) ?? null;
}
