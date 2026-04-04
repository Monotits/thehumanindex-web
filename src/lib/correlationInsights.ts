/**
 * Cross-Domain Correlation Insights
 *
 * Analyzes relationships between seemingly unrelated indicators
 * and generates human-readable commentary explaining the connections.
 *
 * The goal: show users that divorce rates, gun sales, overdose deaths,
 * VIX spikes, and jobless claims aren't isolated — they're symptoms
 * of the same underlying stress.
 */

export interface CorrelationInsight {
  id: string
  title: string
  domains: string[]         // which domains are involved
  indicators: string[]      // which indicator names trigger this
  severity: 'info' | 'warning' | 'critical'
  commentary: string
  dataPoints: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[]
}

interface IndicatorSnapshot {
  domain: string
  indicator: string
  value: number
  normalized: number
}

/**
 * Given the full set of normalized indicator scores,
 * detect meaningful cross-domain correlations and return insights.
 */
export function generateCorrelationInsights(
  indicators: IndicatorSnapshot[]
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = []
  const byName: Record<string, IndicatorSnapshot> = {}
  const byDomain: Record<string, IndicatorSnapshot[]> = {}

  for (const ind of indicators) {
    byName[ind.indicator] = ind
    if (!byDomain[ind.domain]) byDomain[ind.domain] = []
    byDomain[ind.domain].push(ind)
  }

  // Helper: get normalized score by partial indicator name match
  const find = (partial: string): IndicatorSnapshot | undefined =>
    indicators.find(i => i.indicator.toLowerCase().includes(partial.toLowerCase()))

  // ─── CORRELATION 1: Fear Spiral ───
  // VIX high + Consumer Sentiment low + Firearm purchases high
  const vix = find('VIX')
  const sentiment = find('Consumer Sentiment')
  const nics = find('Firearm Background')
  if (vix && sentiment && nics) {
    const avgStress = (vix.normalized + sentiment.normalized + nics.normalized) / 3
    if (avgStress > 45) {
      insights.push({
        id: 'fear-spiral',
        title: 'Fear Spiral Detected',
        domains: ['sentiment', 'unrest'],
        indicators: [vix.indicator, sentiment.indicator, nics.indicator],
        severity: avgStress > 65 ? 'critical' : 'warning',
        commentary: `Market fear (VIX), consumer pessimism, and firearm purchases are all elevated simultaneously. When people feel financially insecure and lose confidence in institutions, gun sales historically spike — not because of crime, but because of perceived instability. This triangulation suggests deep anxiety across economic and social dimensions.`,
        dataPoints: [
          { label: 'VIX Fear Index', value: vix.value.toFixed(1), trend: vix.normalized > 50 ? 'up' : 'stable' },
          { label: 'Consumer Sentiment', value: sentiment.value.toFixed(1), trend: sentiment.normalized > 50 ? 'down' : 'stable' },
          { label: 'Gun Background Checks', value: `${nics.value}M/yr`, trend: nics.normalized > 50 ? 'up' : 'stable' },
        ],
      })
    }
  }

  // ─── CORRELATION 2: Despair Index ───
  // Overdose deaths + Divorce rate + Suicide rate + Saving rate all stressed
  const overdose = find('Drug Overdose')
  const divorce = find('Divorce')
  const suicide = find('Suicide Rate')
  const savings = find('Saving Rate')
  const despairIndicators = [overdose, divorce, suicide, savings].filter(Boolean) as IndicatorSnapshot[]
  if (despairIndicators.length >= 3) {
    const avgDespair = despairIndicators.reduce((s, i) => s + i.normalized, 0) / despairIndicators.length
    if (avgDespair > 35) {
      insights.push({
        id: 'despair-index',
        title: 'Deaths of Despair Signal',
        domains: ['wellbeing'],
        indicators: despairIndicators.map(i => i.indicator),
        severity: avgDespair > 60 ? 'critical' : 'warning',
        commentary: `Drug overdose deaths, family instability (divorce), suicide rates, and financial fragility (low savings) form a well-documented pattern economists call "deaths of despair." These aren't independent crises — they share root causes: economic displacement, loss of community, and declining social mobility. When all four move together, it signals systemic social decay, not isolated incidents.`,
        dataPoints: despairIndicators.map(i => ({
          label: i.indicator.replace(/\(.*\)/, '').trim(),
          value: typeof i.value === 'number' ? i.value.toLocaleString() : String(i.value),
          trend: i.normalized > 50 ? 'up' : i.normalized > 30 ? 'stable' : 'down',
        })),
      })
    }
  }

  // ─── CORRELATION 3: Inequality–Unrest Link ───
  // Gini high + Poverty high + Violent crime elevated + Low trust
  const gini = find('Gini')
  const poverty = find('Poverty Rate')
  const violentCrime = find('Violent Crime')
  const trust = find('Trust in Government')
  const inequalityUnrest = [gini, poverty, violentCrime, trust].filter(Boolean) as IndicatorSnapshot[]
  if (inequalityUnrest.length >= 3) {
    const avg = inequalityUnrest.reduce((s, i) => s + i.normalized, 0) / inequalityUnrest.length
    if (avg > 35) {
      insights.push({
        id: 'inequality-unrest',
        title: 'Inequality–Instability Correlation',
        domains: ['inequality', 'unrest', 'decay'],
        indicators: inequalityUnrest.map(i => i.indicator),
        severity: avg > 60 ? 'critical' : 'warning',
        commentary: `Rising inequality, poverty, violent crime, and declining institutional trust form a reinforcing cycle. Research consistently shows that when the Gini coefficient rises above 40 and government trust falls below 30%, social instability indicators (crime, protests, political polarization) accelerate. The connection isn't coincidental — people who feel the system doesn't work for them stop trusting it, and societies with extreme wealth gaps historically experience more violence.`,
        dataPoints: inequalityUnrest.map(i => ({
          label: i.indicator.replace(/\(.*\)/, '').trim(),
          value: typeof i.value === 'number' ? i.value.toLocaleString() : String(i.value),
          trend: i.normalized > 50 ? 'up' : 'stable',
        })),
      })
    }
  }

  // ─── CORRELATION 4: Economic Displacement Cascade ───
  // Jobless claims high + AI adoption high + Median income declining + Homelessness rising
  const jobless = find('Jobless Claims')
  const aiAdoption = find('AI Adoption')
  const medianIncome = find('Median Household')
  const homeless = find('Homeless')
  const displacementSet = [jobless, aiAdoption, medianIncome, homeless].filter(Boolean) as IndicatorSnapshot[]
  if (displacementSet.length >= 3) {
    const avg = displacementSet.reduce((s, i) => s + i.normalized, 0) / displacementSet.length
    if (avg > 30) {
      insights.push({
        id: 'displacement-cascade',
        title: 'Economic Displacement Cascade',
        domains: ['work_risk', 'inequality', 'wellbeing'],
        indicators: displacementSet.map(i => i.indicator),
        severity: avg > 55 ? 'critical' : avg > 40 ? 'warning' : 'info',
        commentary: `Job losses, accelerating AI adoption, stagnant median incomes, and rising homelessness form a displacement cascade. As automation eliminates middle-skill jobs, displaced workers face downward wage pressure. Those who can't adapt see their incomes stagnate while housing costs rise — and for some, the endpoint is homelessness. This isn't a single policy failure but a structural economic transition playing out in real time.`,
        dataPoints: displacementSet.map(i => ({
          label: i.indicator.replace(/\(.*\)/, '').trim(),
          value: typeof i.value === 'number' ? i.value.toLocaleString() : String(i.value),
          trend: i.normalized > 45 ? 'up' : 'stable',
        })),
      })
    }
  }

  // ─── CORRELATION 5: Fiscal Stress Trap ───
  // Debt/GDP high + Social spending high + Treasury spread inverted
  const debt = find('Federal Debt')
  const socialSpending = find('Social Benefits')
  const yieldCurve = find('Treasury Spread')
  const fiscalSet = [debt, socialSpending, yieldCurve].filter(Boolean) as IndicatorSnapshot[]
  if (fiscalSet.length >= 2) {
    const avg = fiscalSet.reduce((s, i) => s + i.normalized, 0) / fiscalSet.length
    if (avg > 40) {
      insights.push({
        id: 'fiscal-trap',
        title: 'Fiscal Stress Trap',
        domains: ['policy', 'decay'],
        indicators: fiscalSet.map(i => i.indicator),
        severity: avg > 65 ? 'critical' : 'warning',
        commentary: `High government debt, elevated social spending, and yield curve stress create a policy trap: the government needs to spend more to cushion economic displacement, but rising debt limits its capacity to do so. An inverted yield curve signals that markets expect economic contraction — which would further strain fiscal resources. This pattern preceded both the 2008 financial crisis and the 2020 pandemic response.`,
        dataPoints: fiscalSet.map(i => ({
          label: i.indicator.replace(/\(.*\)/, '').trim(),
          value: typeof i.value === 'number' ? i.value.toLocaleString() : String(i.value),
          trend: i.normalized > 50 ? 'up' : 'stable',
        })),
      })
    }
  }

  // ─── CORRELATION 6: Social Fabric Erosion ───
  // Life satisfaction low + Voter turnout low + Divorce high + Trust low
  const lifeSat = find('Life Satisfaction')
  const voterTurnout = find('Voter Turnout')
  const fabricSet = [lifeSat, divorce, voterTurnout, trust].filter(Boolean) as IndicatorSnapshot[]
  if (fabricSet.length >= 3) {
    const avg = fabricSet.reduce((s, i) => s + i.normalized, 0) / fabricSet.length
    if (avg > 35) {
      insights.push({
        id: 'social-fabric',
        title: 'Social Fabric Erosion',
        domains: ['wellbeing', 'unrest', 'decay'],
        indicators: fabricSet.map(i => i.indicator),
        severity: avg > 60 ? 'critical' : 'warning',
        commentary: `When people are unhappy (low life satisfaction), disengaged (low voter turnout), disconnected from family (high divorce), and distrustful of institutions — the social fabric is fraying. These indicators rarely move independently. Societies where all four deteriorate simultaneously tend to see rising populism, polarization, and institutional instability within 5-10 years.`,
        dataPoints: fabricSet.map(i => ({
          label: i.indicator.replace(/\(.*\)/, '').trim(),
          value: typeof i.value === 'number' ? i.value.toLocaleString() : String(i.value),
          trend: i.normalized > 45 ? 'up' : 'stable',
        })),
      })
    }
  }

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return insights
}
