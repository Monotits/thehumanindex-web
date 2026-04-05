import { QuizInput, QuizResult } from '@/lib/types'
import { scoreToBand } from '@/lib/utils'
import { getPostHogClient } from '@/lib/posthog-server'

/**
 * Task automation risk database — based on O*NET task categories
 * and AI capability assessments. Each entry maps a keyword or phrase
 * to its estimated automation exposure (0 = safe, 1 = fully automatable).
 */
const TASK_RISK_DB: { pattern: RegExp; exposure: number; label: string }[] = [
  // High exposure (0.7-0.95) — routine cognitive, data-heavy
  { pattern: /data\s*entry/i, exposure: 0.92, label: 'Data Entry' },
  { pattern: /transcription|transcribing/i, exposure: 0.91, label: 'Transcription' },
  { pattern: /translat(e|ion|ing)/i, exposure: 0.88, label: 'Translation' },
  { pattern: /bookkeep|accounting\s*(entry|record)/i, exposure: 0.87, label: 'Bookkeeping' },
  { pattern: /tax\s*(prep|return|filing)/i, exposure: 0.85, label: 'Tax Preparation' },
  { pattern: /copywriting|copy\s*writing|content\s*writing/i, exposure: 0.82, label: 'Content Writing' },
  { pattern: /data\s*analysis|data\s*analytic/i, exposure: 0.78, label: 'Data Analysis' },
  { pattern: /spreadsheet|excel/i, exposure: 0.76, label: 'Spreadsheet Work' },
  { pattern: /report\s*(writing|generation|creating)/i, exposure: 0.75, label: 'Report Generation' },
  { pattern: /scheduling|calendar\s*management/i, exposure: 0.74, label: 'Scheduling' },
  { pattern: /customer\s*service|support\s*ticket/i, exposure: 0.73, label: 'Customer Service' },
  { pattern: /email\s*(management|sorting|drafting)/i, exposure: 0.72, label: 'Email Management' },
  { pattern: /financial\s*model/i, exposure: 0.71, label: 'Financial Modeling' },
  { pattern: /quality\s*assurance|QA\s*test/i, exposure: 0.70, label: 'QA Testing' },

  // Moderate-high (0.5-0.69) — cognitive but creative or judgment-involved
  { pattern: /programming|coding|software\s*develop/i, exposure: 0.62, label: 'Software Development' },
  { pattern: /graphic\s*design/i, exposure: 0.60, label: 'Graphic Design' },
  { pattern: /market(ing)?\s*(research|analysis)/i, exposure: 0.58, label: 'Market Research' },
  { pattern: /legal\s*research|case\s*review/i, exposure: 0.57, label: 'Legal Research' },
  { pattern: /editing|proofreading/i, exposure: 0.56, label: 'Editing & Proofreading' },
  { pattern: /presentation|slide\s*deck/i, exposure: 0.55, label: 'Presentation Creation' },
  { pattern: /project\s*management/i, exposure: 0.52, label: 'Project Management' },
  { pattern: /research|literature\s*review/i, exposure: 0.50, label: 'Research' },

  // Moderate (0.3-0.49) — mixed human-AI
  { pattern: /manag(e|ing|ement)\s*(team|people|staff)/i, exposure: 0.38, label: 'People Management' },
  { pattern: /consult(ing|ation)/i, exposure: 0.42, label: 'Consulting' },
  { pattern: /sales|business\s*development/i, exposure: 0.40, label: 'Sales' },
  { pattern: /negotiat(e|ion|ing)/i, exposure: 0.30, label: 'Negotiation' },
  { pattern: /teach(ing)?|training\s*(employees|staff)/i, exposure: 0.35, label: 'Teaching & Training' },
  { pattern: /strateg(y|ic)\s*planning/i, exposure: 0.32, label: 'Strategic Planning' },
  { pattern: /product\s*management/i, exposure: 0.45, label: 'Product Management' },
  { pattern: /UX|user\s*experience|user\s*research/i, exposure: 0.44, label: 'UX Design' },
  { pattern: /hiring|recruit(ing|ment)/i, exposure: 0.43, label: 'Recruitment' },

  // Low (0.1-0.29) — physical, empathetic, creative judgment
  { pattern: /leadership|executive/i, exposure: 0.22, label: 'Executive Leadership' },
  { pattern: /mentor(ing|ship)/i, exposure: 0.20, label: 'Mentoring' },
  { pattern: /patient\s*care|nursing|clinical/i, exposure: 0.18, label: 'Patient Care' },
  { pattern: /surgery|surgical/i, exposure: 0.12, label: 'Surgery' },
  { pattern: /therapy|counseling|psycho/i, exposure: 0.15, label: 'Therapy & Counseling' },
  { pattern: /plumbing|electric(al|ian)|HVAC|welding/i, exposure: 0.10, label: 'Skilled Trades' },
  { pattern: /construction|carpentry|masonry/i, exposure: 0.12, label: 'Construction' },
  { pattern: /cooking|chef|culinary/i, exposure: 0.14, label: 'Culinary Arts' },
  { pattern: /child\s*care|daycare/i, exposure: 0.13, label: 'Childcare' },
  { pattern: /emergency|first\s*respond/i, exposure: 0.11, label: 'Emergency Response' },
]

/**
 * Industry-level AI adoption multiplier
 */
const INDUSTRY_MULTIPLIER: { pattern: RegExp; multiplier: number }[] = [
  { pattern: /tech(nology)?|software|SaaS|IT/i, multiplier: 1.15 },
  { pattern: /financ(e|ial)|bank(ing)?|insurance/i, multiplier: 1.12 },
  { pattern: /media|journalism|publishing/i, multiplier: 1.18 },
  { pattern: /legal|law\s*firm/i, multiplier: 1.10 },
  { pattern: /market(ing)|advertising|agency/i, multiplier: 1.14 },
  { pattern: /consult(ing)?/i, multiplier: 1.08 },
  { pattern: /retail|e-?commerce/i, multiplier: 1.05 },
  { pattern: /manufact(uring|ure)/i, multiplier: 0.95 },
  { pattern: /health(care)?|hospital|medical/i, multiplier: 0.88 },
  { pattern: /education|university|school/i, multiplier: 0.90 },
  { pattern: /government|public\s*sector/i, multiplier: 0.85 },
  { pattern: /construction|real\s*estate/i, multiplier: 0.82 },
  { pattern: /agriculture|farming/i, multiplier: 0.80 },
]

function getIndustryMultiplier(industry: string): number {
  for (const { pattern, multiplier } of INDUSTRY_MULTIPLIER) {
    if (pattern.test(industry)) return multiplier
  }
  return 1.0
}

function matchTask(task: string): { exposure: number; label: string } {
  for (const entry of TASK_RISK_DB) {
    if (entry.pattern.test(task)) {
      return { exposure: entry.exposure, label: entry.label }
    }
  }
  // Generic fallback based on keywords
  const lower = task.toLowerCase()
  if (lower.includes('data') || lower.includes('analys')) return { exposure: 0.65, label: task }
  if (lower.includes('writing') || lower.includes('content')) return { exposure: 0.70, label: task }
  if (lower.includes('manage') || lower.includes('lead')) return { exposure: 0.35, label: task }
  if (lower.includes('design') || lower.includes('creative')) return { exposure: 0.48, label: task }
  if (lower.includes('support') || lower.includes('assist')) return { exposure: 0.65, label: task }
  return { exposure: 0.50, label: task }
}

export async function POST(request: Request) {
  try {
    const input: QuizInput = await request.json()

    // Match tasks with risk database
    const taskResults = input.tasks.map(task => matchTask(task))

    // Base exposure from tasks
    let taskExposure = 0.50
    if (taskResults.length > 0) {
      // Weight top risk tasks more heavily
      const sorted = [...taskResults].sort((a, b) => b.exposure - a.exposure)
      const weights = sorted.map((_, i) => 1 / (i + 1))
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      taskExposure = sorted.reduce((sum, t, i) => sum + t.exposure * weights[i], 0) / totalWeight
    }

    // Industry multiplier
    const industryMult = getIndustryMultiplier(input.industry)

    // Experience factor: more experience gives slight protection (adaptability + seniority)
    const expYears = Math.min(input.experience_years, 40)
    const experienceFactor = 1 - (expYears / 80) // 0 years = 1.0, 20 years = 0.75, 40 years = 0.50

    // Education factor
    const educationFactors: Record<string, number> = {
      high_school: 1.05,
      bachelors: 0.95,
      masters: 0.88,
      phd: 0.80,
      other: 0.95,
    }
    const educationFactor = educationFactors[input.education_level] ?? 0.95

    // Age factor: mid-career workers face highest transition cost
    const ageFactors: Record<string, number> = {
      '18-24': 0.82,   // young, adaptable
      '25-34': 0.90,
      '35-44': 1.00,   // peak transition cost
      '45-54': 1.08,
      '55+': 1.12,     // hardest transition but also closer to retirement
    }
    const ageFactor = ageFactors[input.age_range] ?? 1.0

    // Composite calculation
    let rawScore = taskExposure * 100 * industryMult * experienceFactor * educationFactor * ageFactor
    rawScore = Math.min(98, Math.max(5, rawScore))

    // Add small variance based on task count (more tasks = more comprehensive assessment)
    const confidence = Math.min(1, input.tasks.length / 5)
    const finalScore = Math.round(rawScore * (0.9 + 0.1 * confidence))

    // Percentile: map to realistic distribution (slightly right-skewed)
    const percentile = Math.round(Math.min(99, Math.max(1, finalScore * 1.05 - 3)))

    // Exposure band
    const band = scoreToBand(finalScore)

    // Top tasks at risk (up to 5)
    const topTasks = [...taskResults]
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 5)
      .map(t => ({ task: t.label, exposure: +t.exposure.toFixed(2) }))

    // Dynamic skill recommendations based on actual exposure profile
    const highRiskCount = taskResults.filter(t => t.exposure >= 0.7).length
    const midRiskCount = taskResults.filter(t => t.exposure >= 0.4 && t.exposure < 0.7).length

    const allSkills = [
      { skill: 'AI Collaboration & Prompt Engineering', reason: 'The most in-demand skill of 2026. Workers who can direct AI tools effectively command 23% salary premiums over peers who cannot.', priority: highRiskCount > 0 ? 10 : 5 },
      { skill: 'Systems Thinking & Complex Problem Solving', reason: 'AI excels at narrow tasks but struggles with interconnected systems. This skill turns you from a task executor into an irreplaceable orchestrator.', priority: 8 },
      { skill: 'Strategic Communication & Stakeholder Management', reason: 'Persuading humans, building consensus, and navigating organizational politics remain distinctly human capabilities that AI cannot replicate.', priority: midRiskCount > 0 ? 7 : 4 },
      { skill: 'Data Literacy & AI Oversight', reason: 'Understanding what AI outputs mean, catching errors, and knowing when to trust vs. verify is becoming essential across all knowledge work.', priority: highRiskCount > 1 ? 9 : 6 },
      { skill: 'Change Management & Adaptability', reason: 'Organizations need people who can guide teams through AI transitions. This meta-skill makes you valuable regardless of which specific tasks get automated.', priority: finalScore > 60 ? 8 : 3 },
      { skill: 'Domain Expertise & Specialized Knowledge', reason: 'Deep expertise in your specific field becomes more valuable, not less, when AI handles routine work. The expert who checks AI\'s work commands a premium.', priority: 5 },
    ]

    const skillRecs = allSkills
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map(s => ({ skill: s.skill, reason: s.reason, course_url: '' }))

    // Region context
    const regionContext = {
      unemployment_rate: input.country === 'US' ? 4.1 : input.country === 'UK' ? 4.3 : 5.2,
      tech_industry_concentration: ['US', 'UK', 'DE', 'KR', 'JP', 'CN', 'IL'].includes(input.country?.toUpperCase() ?? '') ? 'High' : 'Moderate',
      ai_adoption_speed: ['US', 'CN', 'UK', 'KR'].includes(input.country?.toUpperCase() ?? '') ? 'Accelerating' : 'Moderate',
    }

    const result: QuizResult = {
      id: `result-${Date.now()}`,
      exposure_band: band,
      percentile,
      percentile_label: `${percentile}${percentile % 10 === 1 && percentile !== 11 ? 'st' : percentile % 10 === 2 && percentile !== 12 ? 'nd' : percentile % 10 === 3 && percentile !== 13 ? 'rd' : 'th'} percentile`,
      top_tasks_at_risk: topTasks,
      skill_recommendations: skillRecs,
      region_context: regionContext,
      share_card_data: {
        band: band.toUpperCase(),
        percentile_text: `${percentile}th percentile`,
        job_title: input.job_title,
        region: input.region || input.country,
      },
    }

    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: `anon-quiz-${Date.now()}`,
      event: 'quiz_evaluated',
      properties: {
        job_title: input.job_title,
        industry: input.industry,
        exposure_band: band,
        percentile,
        final_score: finalScore,
        task_count: input.tasks.length,
        country: input.country,
      },
    })
    await posthog.shutdown()

    return Response.json(result)
  } catch (error) {
    console.error('Quiz evaluation error:', error)
    return Response.json({ error: 'Failed to evaluate quiz' }, { status: 500 })
  }
}
