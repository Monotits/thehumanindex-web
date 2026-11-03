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
      'Four quick questions about where you live, what you do, and what worries you. We map your answers to the live indicators we track and tell you which stresses matter most for someone in your situation — with the actual numbers.',
    description:
      'A 60-second personal stress profile against live country-level data across 5 meta-indexes.',
    badge: 'Personal assessment',
    duration: '60 seconds',
  },
  {
    slug: 'would-you-thrive',
    title: 'Which of your country’s stresses actually hit you?',
    subhead:
      'Tell us where you live and what you care about. We weight the five stress domains by your answers and show your country\'s current scores on each — so you can see which pressures matter for someone like you. Every country page lets you compare further.',
    description:
      'Your concerns × your country\'s current scores on five stress domains — in 60 seconds.',
    badge: 'Personal relevance',
    duration: '60 seconds',
  },
  {
    slug: 'ai-proof-your-job',
    title: 'How exposed is your career to stress where you live?',
    subhead:
      'Pick your country and sector. We weight the five stress domains by your sector and age and show your country\'s current scores on each. (We do not score automation exposure by country: no citable cross-country source exists.)',
    description:
      'Your sector × your country\'s current scores on five stress domains, including technological stress.',
    badge: 'Career lens',
    duration: '60 seconds',
  },
];

export function getQuizVariant(slug: string): QuizVariant | null {
  return QUIZ_VARIANTS.find((v) => v.slug === slug) ?? null;
}
