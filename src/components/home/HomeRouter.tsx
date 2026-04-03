'use client'

import { useTheme } from '@/lib/theme'
import { CompositeScore, Commentary } from '@/lib/types'
import { KeyStat } from '@/lib/realData'
import { MonthlyScore } from '@/lib/historicalData'
import HomeTerminal from './HomeTerminal'
import HomeBriefing from './HomeBriefing'
import HomeSignal from './HomeSignal'

interface Props {
  score: CompositeScore
  pulse: Commentary
  keyStat?: KeyStat
  trendHistory?: MonthlyScore[]
}

export default function HomeRouter({ score, pulse, keyStat, trendHistory }: Props) {
  const { themeId } = useTheme()

  switch (themeId) {
    case 'terminal':
      return <HomeTerminal score={score} pulse={pulse} keyStat={keyStat} trendHistory={trendHistory} />
    case 'briefing':
      return <HomeBriefing score={score} pulse={pulse} keyStat={keyStat} trendHistory={trendHistory} />
    case 'signal':
    default:
      return <HomeSignal score={score} pulse={pulse} keyStat={keyStat} trendHistory={trendHistory} />
  }
}
