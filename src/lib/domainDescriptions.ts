/**
 * Dynamic domain context descriptions
 * Generates a short 1-2 sentence explanation based on
 * the domain, its current score, and week-over-week change.
 */

import { Domain } from './types'

interface DomainContext {
  description: string   // what this domain measures
  insight: string       // dynamic interpretation of current value + delta
}

// What each domain tracks
const DOMAIN_WHAT: Record<Domain, string> = {
  work_risk: 'Tracks job displacement pressure from AI adoption, automation trends, and labor market indicators.',
  inequality: 'Measures wealth concentration, income gaps, and economic opportunity distribution.',
  unrest: 'Monitors political instability, civic disengagement, and social tension indicators.',
  decay: 'Tracks institutional trust, governance effectiveness, rule of law, and corruption control.',
  wellbeing: 'Measures population health, life satisfaction, financial security, and mental health indicators.',
  policy: 'Evaluates government fiscal responsiveness, debt sustainability, and social spending adequacy.',
  sentiment: 'Tracks consumer confidence, economic optimism, and public mood from survey data.',
}

// Score band thresholds
function scoreBand(score: number): 'low' | 'moderate' | 'elevated' | 'high' | 'critical' {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 45) return 'elevated'
  if (score >= 25) return 'moderate'
  return 'low'
}

// Dynamic insight based on score + delta
const DOMAIN_INSIGHTS: Record<Domain, Record<string, (delta: number) => string>> = {
  work_risk: {
    critical: (d) => d > 0
      ? `Extreme displacement pressure — AI investment and adoption are accelerating at an unprecedented rate.`
      : `Still at crisis levels, though the pace of acceleration has slightly eased.`,
    high: (d) => d > 0
      ? `Rising automation pressure. Enterprise AI adoption continues to climb, putting more roles at risk.`
      : `Automation pressure remains high but showing early signs of stabilization.`,
    elevated: (d) => d > 0
      ? `Growing displacement signals. Jobless claims and AI deployment are both trending upward.`
      : `Moderate displacement risk. Labor market resilience is partially offsetting AI pressure.`,
    moderate: (d) => d > 0
      ? `Displacement risk is building. Watch for acceleration in enterprise AI adoption.`
      : `Labor market remains relatively healthy despite ongoing automation trends.`,
    low: () => `Low displacement pressure. Labor market conditions are strong and AI disruption is gradual.`,
  },
  inequality: {
    critical: (d) => d > 0
      ? `Extreme wealth concentration. Top income shares are expanding at an alarming rate.`
      : `Inequality remains severe, though the rate of divergence has slowed.`,
    high: (d) => d > 0
      ? `Widening income gap. Gini coefficient continues to climb beyond healthy thresholds.`
      : `High inequality persists, but recent data shows marginal improvement.`,
    elevated: (d) => d > 0
      ? `Income distribution is deteriorating. Middle-class share of national income is shrinking.`
      : `Inequality is notable but not extreme. Some economic indicators show mixed signals.`,
    moderate: (d) => d > 0
      ? `Mild but growing income disparity. Worth monitoring for acceleration.`
      : `Income distribution is within manageable ranges with slight improvement.`,
    low: () => `Relatively equitable income distribution. Economic opportunity appears broadly accessible.`,
  },
  unrest: {
    critical: (d) => d > 0
      ? `Severe instability indicators. Political violence risk and civic disengagement at dangerous levels.`
      : `Crisis-level social tension, though some stabilization signals are emerging.`,
    high: (d) => d > 0
      ? `Rising social tension. Political stability index and civic participation are both deteriorating.`
      : `Social unrest remains elevated but the escalation trend has paused.`,
    elevated: (d) => d > 0
      ? `Growing civic stress. Voter disengagement and political polarization are increasing.`
      : `Moderate social tension with some signs of civic re-engagement.`,
    moderate: (d) => d > 0
      ? `Low-level social friction. Political participation shows some softening.`
      : `Social cohesion is relatively stable. Civil engagement metrics are holding.`,
    low: () => `Stable social environment. Political participation and institutional trust are healthy.`,
  },
  decay: {
    critical: (d) => d > 0
      ? `Institutional integrity in freefall. Governance effectiveness and public trust are collapsing.`
      : `Severe institutional weakness persists, though decline rate has moderated.`,
    high: (d) => d > 0
      ? `Institutional trust eroding. Government effectiveness and rule of law are under growing strain.`
      : `Institutional indicators remain weak but stabilizing at concerning levels.`,
    elevated: (d) => d > 0
      ? `Governance quality declining. Corruption control and regulatory effectiveness are weakening.`
      : `Institutional health is strained but holding above critical thresholds.`,
    moderate: (d) => d > 0
      ? `Mild institutional stress. Some governance indicators showing gradual softening.`
      : `Institutions are functioning adequately with minor improvements in trust metrics.`,
    low: () => `Strong institutional foundations. Governance, rule of law, and trust indicators are healthy.`,
  },
  wellbeing: {
    critical: (d) => d > 0
      ? `Population health crisis deepening. Life expectancy, mental health, and financial security all declining.`
      : `Severe wellbeing deficit, but some health indicators show early recovery signs.`,
    high: (d) => d > 0
      ? `Wellbeing under serious strain. Savings rates are low and mental health indicators worsening.`
      : `High-stress wellbeing levels, though financial fragility is slightly improving.`,
    elevated: (d) => d > 0
      ? `Growing wellbeing concerns. Personal savings declining while health burdens increase.`
      : `Wellbeing pressure easing slightly. Life satisfaction holding at moderate levels.`,
    moderate: (d) => d > 0
      ? `Mild wellbeing strain. Financial security and health outcomes showing mixed signals.`
      : `Population wellbeing relatively stable. Health and financial indicators within normal range.`,
    low: () => `Strong wellbeing indicators. Life satisfaction, savings rates, and health outcomes are positive.`,
  },
  policy: {
    critical: (d) => d > 0
      ? `Fiscal crisis territory. Debt levels unsustainable and policy response capacity severely constrained.`
      : `Extreme fiscal stress, though spending priorities show some rebalancing.`,
    high: (d) => d > 0
      ? `Policy response lagging behind need. Rising debt-to-GDP ratio constraining government options.`
      : `High fiscal strain persists but government spending shows some adaptive signals.`,
    elevated: (d) => d > 0
      ? `Government fiscal capacity under pressure. Debt growing faster than economic output.`
      : `Moderate fiscal strain. Some policy responses beginning to address structural challenges.`,
    moderate: (d) => d > 0
      ? `Mild fiscal pressure building. Debt trajectory warrants attention but remains manageable.`
      : `Fiscal position adequate. Policy tools remain available for crisis response if needed.`,
    low: () => `Healthy fiscal position. Government has ample capacity for responsive policy action.`,
  },
  sentiment: {
    critical: (d) => d > 0
      ? `Public mood in crisis. Consumer confidence has collapsed to levels seen only in severe recessions.`
      : `Extreme pessimism persists, though sentiment appears to be bottoming out.`,
    high: (d) => d > 0
      ? `Consumer confidence falling sharply. Economic pessimism spreading across income groups.`
      : `Sentiment weak but decline has slowed. Markets watching for inflection point.`,
    elevated: (d) => d > 0
      ? `Public confidence eroding. Consumer sentiment indices trending below historical averages.`
      : `Sentiment recovering from lows. Consumers showing cautious improvement in outlook.`,
    moderate: (d) => d > 0
      ? `Mild pessimism creeping in. Consumer confidence softening from recent peaks.`
      : `Public mood stable to slightly positive. Economic expectations within normal band.`,
    low: () => `Optimistic public mood. Consumer confidence and economic expectations are strong.`,
  },
}

export function getDomainContext(domain: Domain, score: number, delta: number): DomainContext {
  const band = scoreBand(score)
  const desc = DOMAIN_WHAT[domain] || ''
  const insightFn = DOMAIN_INSIGHTS[domain]?.[band]
  const insight = insightFn ? insightFn(delta) : ''

  return { description: desc, insight }
}
