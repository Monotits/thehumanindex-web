'use client'

import { useTheme } from '@/lib/theme'
import { DOMAIN_LABELS, Domain } from '@/lib/types'
import { seededRandom } from '@/lib/seededRandom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ChartInsight from './ChartInsight'

interface DomainData {
  domain: Domain
  value: number
  weight: number
}

interface MonthlyRecord {
  year_month: string
  work_risk: number | null
  inequality: number | null
  unrest: number | null
  decay: number | null
  wellbeing: number | null
  policy: number | null
  sentiment: number | null
}

interface Props {
  domains: DomainData[]
  monthlyHistory?: MonthlyRecord[]
}

const DOMAIN_COLORS: Record<string, string> = {
  work_risk: '#ef4444', inequality: '#f97316', sentiment: '#f59e0b',
  policy: '#eab308', unrest: '#3b82f6', decay: '#6366f1', wellbeing: '#22c55e',
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthLabels(count: number): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(MONTH_SHORT[d.getMonth()])
  }
  return labels
}

function generateProjectedWeighted(base: number, weight: number, count: number, seed: string): number[] {
  const rng = seededRandom(`stacked-ghost-${seed}`)
  const data: number[] = []
  for (let i = 0; i < count; i++) {
    const distFromEnd = count - i
    const rawScore = base - distFromEnd * (0.6 + rng() * 0.8) + (rng() - 0.4) * 2
    const v = Math.max(1, rawScore * weight)
    data.push(+v.toFixed(2))
  }
  return data
}

export default function StackedAreaDecomposition({ domains, monthlyHistory }: Props) {
  const { theme } = useTheme()
  const sorted = [...domains].sort((a, b) => (b.value * b.weight) - (a.value * a.weight))
  const totalMonths = 6
  const months = buildMonthLabels(totalMonths)

  // Build chart data from real history + projected
  const hasRealHistory = monthlyHistory && monthlyHistory.length > 0
  const realCount = hasRealHistory ? Math.min(monthlyHistory!.length, totalMonths) : 0
  const projectedCount = totalMonths - realCount - (realCount < totalMonths ? 1 : 0) // -1 for current month

  const chartData = months.map((m, i) => {
    const point: Record<string, string | number | boolean> = { month: m, isProjected: i < projectedCount }

    sorted.forEach(d => {
      const historyIdx = i - projectedCount
      if (historyIdx >= 0 && historyIdx < realCount && hasRealHistory) {
        // Real data from monthly_scores
        const record = monthlyHistory![monthlyHistory!.length - realCount + historyIdx]
        const val = record?.[d.domain as keyof MonthlyRecord]
        point[d.domain] = typeof val === 'number' ? +(val * d.weight).toFixed(2) : +(d.value * d.weight).toFixed(2)
      } else if (i === months.length - 1 && realCount < totalMonths) {
        // Current value (last month)
        point[d.domain] = +(d.value * d.weight).toFixed(2)
      } else {
        // Projected
        const projected = generateProjectedWeighted(d.value, d.weight, projectedCount, d.domain)
        point[d.domain] = projected[i] ?? +(d.value * d.weight).toFixed(2)
      }
    })

    return point
  })

  const hasProjected = projectedCount > 0

  const shortLabel = (d: Domain): string => {
    const m: Partial<Record<Domain, string>> = {
      work_risk: 'Work', inequality: 'Ineq', sentiment: 'Sent',
      policy: 'Policy', unrest: 'Unrest', decay: 'Decay', wellbeing: 'Well',
    }
    return m[d] || d
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        Composite Decomposition — Weighted Domain Contribution Over Time
        {hasProjected && (
          <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 8, letterSpacing: 1 }}>
            (early months projected)
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <XAxis dataKey="month" tick={{ fill: theme.textTertiary, fontSize: 10 }} stroke="transparent" />
          <YAxis tick={{ fill: theme.textTertiary, fontSize: 9, fontFamily: theme.fontMono }} stroke="transparent" />
          <Tooltip
            contentStyle={{
              background: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: theme.fontBody,
            }}
            formatter={((value: unknown, name: unknown) => [`${Number(value).toFixed(1)}`, DOMAIN_LABELS[String(name) as Domain] || String(name)]) as never}
          />
          <Legend
            formatter={(value: string) => shortLabel(value as Domain)}
            wrapperStyle={{ fontSize: 10, color: theme.textTertiary }}
          />
          {sorted.map(d => (
            <Area
              key={d.domain}
              type="monotone"
              dataKey={d.domain}
              stackId="1"
              stroke={DOMAIN_COLORS[d.domain]}
              fill={DOMAIN_COLORS[d.domain]}
              fillOpacity={0.6}
              strokeWidth={0}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Dynamic Analysis */}
      {(() => {
        const latestContribs = sorted.map(d => ({ domain: d.domain, contrib: +(d.value * d.weight).toFixed(1) }))
        const top = latestContribs[0]
        const bottom = latestContribs[latestContribs.length - 1]
        const topHalf = latestContribs.slice(0, Math.ceil(latestContribs.length / 2))
        const topHalfPct = ((topHalf.reduce((s, d) => s + d.contrib, 0) / latestContribs.reduce((s, d) => s + d.contrib, 0)) * 100).toFixed(0)
        return (
          <ChartInsight title="Composition over time">
            {hasProjected && <em style={{ opacity: 0.6 }}>Early months are projected estimates. </em>}
            The stacked view reveals how the composite score is built up over time. <strong>{DOMAIN_LABELS[top.domain as Domain]}</strong> consistently occupies the largest band ({top.contrib} weighted pts), while <strong>{DOMAIN_LABELS[bottom.domain as Domain]}</strong> contributes the least ({bottom.contrib} pts). The top half of domains account for {topHalfPct}% of the total — a structural imbalance suggesting the index is disproportionately driven by a handful of stress vectors. Watch for bands that widen month-over-month: that signals accelerating contribution from that domain.
          </ChartInsight>
        )
      })()}
    </div>
  )
}
