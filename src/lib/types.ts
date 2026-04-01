export type Band = 'low' | 'moderate' | 'elevated' | 'high' | 'critical'

export type ScoreType = 'composite' | 'pulse'

export type Domain = 'work_risk' | 'inequality' | 'unrest' | 'decay' | 'wellbeing' | 'policy' | 'sentiment'

export interface CompositeScore {
  id: string
  score_type: ScoreType
  score_value: number
  band: Band
  delta: number | null
  computed_at: string
  metadata: Record<string, unknown> | null
  sub_indexes?: SubIndex[]
}

export interface SubIndex {
  id: string
  composite_score_id: string
  domain: Domain
  value: number
  weight: number
  source_updated_at: string | null
  raw_data: Record<string, unknown> | null
}

export interface Commentary {
  id: string
  type: 'weekly_pulse' | 'monthly_report'
  title: string
  body_markdown: string
  composite_score_id: string | null
  published_at: string
  slug: string
}

export interface QuizInput {
  job_title: string
  industry: string
  tasks: string[]
  experience_years: number
  education_level: 'high_school' | 'bachelors' | 'masters' | 'phd' | 'other'
  country: string
  region?: string
  age_range: '18-24' | '25-34' | '35-44' | '45-54' | '55+'
}

export interface QuizResult {
  id: string
  exposure_band: Band
  percentile: number
  percentile_label: string
  top_tasks_at_risk: { task: string; exposure: number }[]
  skill_recommendations: { skill: string; reason: string; course_url?: string }[]
  region_context: {
    unemployment_rate?: number
    tech_industry_concentration?: string
    ai_adoption_speed?: string
  } | null
  share_card_data: {
    band: string
    percentile_text: string
    job_title: string
    region: string
  }
}

export const BAND_COLORS: Record<Band, string> = {
  low: '#22c55e',
  moderate: '#3b82f6',
  elevated: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

export const BAND_LABELS: Record<Band, string> = {
  low: 'LOW',
  moderate: 'MODERATE',
  elevated: 'ELEVATED',
  high: 'HIGH',
  critical: 'CRITICAL',
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  work_risk: 'AI Work Displacement',
  inequality: 'Income Inequality',
  unrest: 'Social Unrest',
  decay: 'Institutional Decay',
  wellbeing: 'Social Wellbeing',
  policy: 'Policy Response',
  sentiment: 'Public Sentiment',
}

/** @deprecated Use <DomainIcon domain={d} /> component instead */
export const DOMAIN_ICONS: Record<Domain, string> = {
  work_risk: '⚙️',
  inequality: '📊',
  unrest: '🔥',
  decay: '🏛️',
  wellbeing: '💊',
  policy: '📜',
  sentiment: '📡',
}
