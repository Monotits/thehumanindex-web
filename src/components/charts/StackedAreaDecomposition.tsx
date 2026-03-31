'use client'

import { useTheme } from '@/lib/theme'
import { DOMAIN_LABELS, Domain } from '@/lib/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DomainData {
  domain: Domain
  value: number
  weight: number
}

interface Props {
  domains: DomainData[]
}

const DOMAIN_COLORS: Record<string, string> = {
  work_risk: '#ef4444', inequality: '#f97316', sentiment: '#f59e0b',
  policy: '#eab308', unrest: '#3b82f6', decay: '#6366f1', wellbeing: '#22c55e',
}

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

function generateWeightedTrend(base: number, weight: number): number[] {
  const data: number[] = []
  for (let i = 0; i < 5; i++) {
    const v = Math.max(1, (base - (5 - i) * (0.6 + Math.random() * 1.0) + (Math.random() - 0.3) * 2) * weight)
    data.push(+v.toFixed(2))
  }
  data.push(+(base * weight).toFixed(2))
  return data
}

export default function StackedAreaDecomposition({ domains }: Props) {
  const { theme } = useTheme()
  const sorted = [...domains].sort((a, b) => (b.value * b.weight) - (a.value * a.weight))

  // Build data array for recharts
  const trendsByDomain = sorted.map(d => ({
    domain: d.domain,
    trend: generateWeightedTrend(d.value, d.weight),
  }))

  const chartData = MONTHS.map((m, i) => {
    const point: Record<string, string | number> = { month: m }
    trendsByDomain.forEach(t => {
      point[t.domain] = t.trend[i]
    })
    return point
  })

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
    </div>
  )
}
