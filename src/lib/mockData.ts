import { CompositeScore, Commentary } from './types'

export const MOCK_COMPOSITE_SCORE: CompositeScore = {
  id: 'mock-score-1',
  score_type: 'composite',
  score_value: 58,
  band: 'elevated',
  delta: 2.3,
  computed_at: new Date().toISOString(),
  metadata: null,
  sub_indexes: [
    {
      id: 'sub-1',
      composite_score_id: 'mock-score-1',
      domain: 'work_risk',
      value: 72,
      weight: 0.25,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
    {
      id: 'sub-2',
      composite_score_id: 'mock-score-1',
      domain: 'inequality',
      value: 64,
      weight: 0.18,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
    {
      id: 'sub-3',
      composite_score_id: 'mock-score-1',
      domain: 'unrest',
      value: 51,
      weight: 0.15,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
    {
      id: 'sub-4',
      composite_score_id: 'mock-score-1',
      domain: 'decay',
      value: 43,
      weight: 0.12,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
    {
      id: 'sub-5',
      composite_score_id: 'mock-score-1',
      domain: 'wellbeing',
      value: 38,
      weight: 0.12,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
    {
      id: 'sub-6',
      composite_score_id: 'mock-score-1',
      domain: 'policy',
      value: 55,
      weight: 0.10,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
    {
      id: 'sub-7',
      composite_score_id: 'mock-score-1',
      domain: 'sentiment',
      value: 62,
      weight: 0.08,
      source_updated_at: new Date().toISOString(),
      raw_data: null,
    },
  ],
}

export const MOCK_COMMENTARIES: Commentary[] = [
  {
    id: 'pulse-1',
    type: 'weekly_pulse',
    title: 'The AI Acceleration Threshold',
    body_markdown:
      '# The AI Acceleration Threshold\n\nThis week marked a pivotal moment in the displacement trajectory. Three major developments converged:\n\n## Key Findings\n\n- **Work Risk Index**: Up 2.1 points to 72, driven by enterprise AI adoption announcements\n- **Policy Response**: Lagging at 55, suggesting regulatory friction\n- **Income Inequality**: Continues upward pressure at 64\n\nThe gap between technological deployment and policy intervention is widening. We are seeing early signs of the structural transformation.\n\n## What to Watch\n\nNext week\'s employment reports and tech earnings calls will be critical indicators.',
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'ai-acceleration-threshold',
  },
  {
    id: 'pulse-2',
    type: 'weekly_pulse',
    title: 'Institutional Decay and Social Cohesion',
    body_markdown:
      '# Institutional Decay and Social Cohesion\n\nInstitutional trust metrics show continued decline across democracies. Key observations:\n\n- Trust in institutions: Down 3.2% week-over-week\n- Social media sentiment: 62% negative toward government\n- Institutional Decay Index: Holding steady at 43\n\nWhile political dysfunction remains chronic, the broader social cohesion is being challenged by economic anxiety.',
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'institutional-decay-social-cohesion',
  },
  {
    id: 'pulse-3',
    type: 'weekly_pulse',
    title: 'Employment Transformation Accelerates',
    body_markdown:
      '# Employment Transformation Accelerates\n\nRecord numbers of workers report concerns about job automation. Our latest assessment:\n\n## Labor Market Shifts\n\n- 31% of knowledge workers report automation anxiety\n- Average job tenure declining in tech sectors\n- New skills demand: Prompt engineering, AI oversight, Systems thinking\n\nThe skills gap is widening at an accelerating pace.',
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'employment-transformation-accelerates',
  },
]
