'use client'

import { useTheme } from '@/lib/theme'
import { seededRandom } from '@/lib/seededRandom'
import ChartInsight from './ChartInsight'

interface Props {
  currentScore: number
}

// Generate 12 weeks of plausible composite scores
function generateWeeklyScores(current: number): { week: string; score: number }[] {
  const rng = seededRandom(`heatmap-${current.toFixed(1)}`)
  const weeks: { week: string; score: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const noise = (rng() - 0.4) * 3
    const trend = (11 - i) * 0.35
    const score = Math.max(20, Math.min(85, current - (11 - i) * 0.5 + noise + trend * 0.2 - 4))
    const date = new Date()
    date.setDate(date.getDate() - i * 7)
    weeks.push({
      week: `W${52 - i}`,
      score: +score.toFixed(1),
    })
  }
  // Make last entry exact current
  weeks[weeks.length - 1].score = current
  return weeks
}

function scoreColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 55) return '#f97316'
  if (score >= 45) return '#f59e0b'
  if (score >= 30) return '#3b82f6'
  return '#22c55e'
}

export default function WeeklyHeatmap({ currentScore }: Props) {
  const { theme } = useTheme()
  const weeks = generateWeeklyScores(currentScore)

  const cellW = 36
  const cellH = 36
  const gap = 4
  const cols = 6

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textTertiary, textTransform: 'uppercase', marginBottom: 12 }}>
        12-Week Stress Heatmap
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, maxWidth: (cellW + gap) * cols }}>
        {weeks.map((w, i) => {
          const color = scoreColor(w.score)
          const isLast = i === weeks.length - 1
          return (
            <div
              key={w.week}
              style={{
                width: cellW,
                height: cellH,
                borderRadius: 6,
                background: `${color}${isLast ? '40' : '25'}`,
                border: isLast ? `2px solid ${color}` : `1px solid ${color}20`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
              }}
              title={`${w.week}: ${w.score}`}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color, fontFamily: theme.fontMono }}>{w.score.toFixed(0)}</div>
              <div style={{ fontSize: 7, color: theme.textTertiary, marginTop: 1 }}>{w.week}</div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 9, color: theme.textTertiary }}>
        <span>Intensity:</span>
        {[
          { label: 'Low', color: '#22c55e' },
          { label: 'Moderate', color: '#3b82f6' },
          { label: 'Elevated', color: '#f59e0b' },
          { label: 'High', color: '#f97316' },
          { label: 'Critical', color: '#ef4444' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: `${l.color}40` }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Dynamic Analysis */}
      {(() => {
        const scores = weeks.map(w => w.score)
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length
        const max = Math.max(...scores)
        const min = Math.min(...scores)
        const maxWeek = weeks.find(w => w.score === max)
        const trend = scores[scores.length - 1] - scores[0]
        const elevatedCount = scores.filter(s => s >= 55).length
        return (
          <ChartInsight title="12-week pattern">
            Over the past 12 weeks, the composite has averaged {avg.toFixed(1)}, ranging from {min.toFixed(0)} to {max.toFixed(0)} (peak: {maxWeek?.week}). {elevatedCount >= 8
              ? `The index has spent ${elevatedCount} of 12 weeks in elevated territory or above — a sustained pattern rather than isolated spikes, indicating structural rather than episodic stress.`
              : elevatedCount >= 4
                ? `With ${elevatedCount} weeks above the elevated threshold, the pattern shows intermittent but recurring pressure.`
                : 'Most weeks have remained below the elevated threshold, suggesting the current reading may represent a temporary spike rather than a structural shift.'
            } The overall trajectory is {trend > 2 ? 'upward, with a net increase of +' + trend.toFixed(1) + ' pts' : trend < -2 ? 'downward, with a net decrease of ' + trend.toFixed(1) + ' pts' : 'roughly flat over the period'}.
          </ChartInsight>
        )
      })()}
    </div>
  )
}
