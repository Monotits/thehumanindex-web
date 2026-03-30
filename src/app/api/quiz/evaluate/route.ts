import { QuizInput, QuizResult } from '@/lib/types'
import { scoreToBand } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const input: QuizInput = await request.json()

    // Mock implementation - calculate realistic exposure based on task automation
    // In production, this would call a Supabase Edge Function with ML model

    // Simple scoring: higher exposure for routine cognitive tasks
    const automationRiskByTask: Record<string, number> = {
      'data analysis': 0.78,
      'data reporting': 0.76,
      'spreadsheet': 0.72,
      'excel': 0.72,
      'reporting': 0.68,
      'analysis': 0.72,
      'documentation': 0.65,
      'writing': 0.55,
      'management': 0.35,
      'strategy': 0.25,
      'leadership': 0.2,
      'teaching': 0.3,
      'coding': 0.5,
      'design': 0.4,
    }

    // Calculate average exposure from tasks
    let taskExposure = 0.5 // baseline
    if (input.tasks.length > 0) {
      const exposures = input.tasks.map(task => {
        const lower = task.toLowerCase()
        for (const [keyword, score] of Object.entries(automationRiskByTask)) {
          if (lower.includes(keyword)) {
            return score
          }
        }
        return 0.5 // default
      })
      taskExposure = exposures.reduce((a, b) => a + b, 0) / exposures.length
    }

    // Adjust by experience (more experience = lower relative risk)
    const experienceFactor = Math.max(0.5, 1 - input.experience_years / 30)

    // Adjust by education (higher education = more adaptable)
    const educationFactors: Record<string, number> = {
      high_school: 1.0,
      bachelors: 0.9,
      masters: 0.8,
      phd: 0.75,
      other: 0.9,
    }
    const educationFactor = educationFactors[input.education_level]

    // Adjust by age (younger more adaptable, older may have harder time)
    const ageFactors: Record<string, number> = {
      '18-24': 0.8,
      '25-34': 0.85,
      '35-44': 0.9,
      '45-54': 1.0,
      '55+': 1.1,
    }
    const ageFactor = ageFactors[input.age_range]

    // Final score (0-100)
    let finalScore = taskExposure * 100 * experienceFactor * educationFactor * ageFactor
    finalScore = Math.min(100, Math.max(0, finalScore))

    // Calculate percentile (in real system, would compare to user cohort)
    const percentile = Math.round((finalScore / 100) * 100)

    // Determine exposure band
    const band = scoreToBand(finalScore)

    // Top tasks at risk
    const tasksWithExposure = input.tasks
      .map(task => {
        const lower = task.toLowerCase()
        let exposure = 0.5
        for (const [keyword, score] of Object.entries(automationRiskByTask)) {
          if (lower.includes(keyword)) {
            exposure = score
            break
          }
        }
        return { task, exposure }
      })
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 3)

    // Skill recommendations based on exposure
    const skillRecommendations = [
      {
        skill: 'Prompt Engineering & AI Collaboration',
        reason: 'Critical for working effectively with AI systems rather than being replaced by them',
        course_url: 'https://example.com/courses',
      },
      {
        skill: 'Systems Thinking & Strategy',
        reason: 'Higher-order cognitive skills that remain distinctly human and hard to automate',
        course_url: 'https://example.com/courses',
      },
      {
        skill: 'Leadership & Change Management',
        reason: 'Navigating organizational transformation requires uniquely human judgment and empathy',
        course_url: 'https://example.com/courses',
      },
    ]

    // Region context (mock - in production would use geolocation)
    const regionContext = {
      unemployment_rate: 3.8,
      tech_industry_concentration: input.country === 'US' ? 'High' : 'Moderate',
      ai_adoption_speed: input.country === 'US' ? 'Accelerating' : 'Moderate',
    }

    const result: QuizResult = {
      id: `result-${Date.now()}`,
      exposure_band: band,
      percentile,
      percentile_label: `${percentile}th percentile`,
      top_tasks_at_risk: tasksWithExposure,
      skill_recommendations: skillRecommendations,
      region_context: regionContext,
      share_card_data: {
        band: band.toUpperCase(),
        percentile_text: `${percentile}th percentile`,
        job_title: input.job_title,
        region: input.region || input.country,
      },
    }

    return Response.json(result)
  } catch (error) {
    console.error('Quiz evaluation error:', error)
    return Response.json({ error: 'Failed to evaluate quiz' }, { status: 500 })
  }
}
