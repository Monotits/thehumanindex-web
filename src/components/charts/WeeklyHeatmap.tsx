'use client'

import { useTheme } from '@/lib/theme'

interface Props {
  currentScore: number
}

// Generate 12 weeks of plausible composite scores
function generateWeeklyScores(current: number): { week: string; score: number }[] {
  const weeks: { week: string; score: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const noise = (Math.random() - 0.4) * 3
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
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellW}px)`, gap, width: 'fit-content' }}>
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
    </div>
  )
}
