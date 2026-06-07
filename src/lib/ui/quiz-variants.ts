/**
 * Quiz variant catalog.
 *
 * Different entry-point framings for the same underlying QuizExperience
 * engine. Each variant changes the hero copy + URL slug; the multi-step
 * flow and result computation stay identical. This is the lowest-cost
 * way to test which viral framing drives the most shares without
 * forking the quiz logic.
 */

export interface QuizVariant {
  slug: string;
  title: string;
  subhead: string;
  description: string;
  badge: string;
  duration: string;
}

export const QUIZ_VARIANTS: QuizVariant[] = [
  {
    slug: 'civilizational-stress',
    title: 'How exposed are you to civilizational stress?',
    subhead:
      'Five quick questions about where you live, what you do, and what worries you. We map your answers to the live indicators we track and tell you which stresses matter most for someone in your situation — with the actual numbers.',
    description:
      'A 60-second personal stress profile against live country-level data across 5 meta-indexes.',
    badge: 'Personal assessment',
    duration: '60 seconds',
  },
  {
    slug: 'would-you-thrive',
    title: 'Would you thrive somewhere else?',
    subhead:
      'Tell us where you are and what you care about. We compare your country\'s live stress signals to the rest of the 25 we track — and show you which countries are actually less stressed on the dimensions that matter to you.',
    description:
      'See which countries are objectively less stressed on the dimensions that matter to you — based on live data.',
    badge: 'Country compatibility',
    duration: '60 seconds',
  },
  {
    slug: 'ai-proof-your-job',
    title: 'How AI-proof is your job?',
    subhead:
      'Pick your country and sector. We pull live automation exposure, AI displacement and technological stress data for your specific situation — and show you where on the global ranking your career sits in 2026.',
    description:
      'Live automation + AI displacement signals for your country and sector. See where you actually stand.',
    badge: 'Job risk',
    duration: '60 seconds',
  },
];

export function getQuizVariant(slug: string): QuizVariant | null {
  return QUIZ_VARIANTS.find((v) => v.slug === slug) ?? null;
}
