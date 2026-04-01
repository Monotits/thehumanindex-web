'use client'

import { useTheme } from '@/lib/theme'
import { CompositeScore, Commentary } from '@/lib/types'
import { KeyStat } from '@/lib/realData'
import HomeTerminal from './HomeTerminal'
import HomeBriefing from './HomeBriefing'
import HomeSignal from './HomeSignal'

interface Props {
  score: CompositeScore
  pulse: Commentary
  keyStat?: KeyStat
}

export default function HomeRouter({ score, pulse, keyStat }: Props) {
  const { themeId } = useTheme()

  switch (themeId) {
    case 'terminal':
      return <HomeTerminal score={score} pulse={pulse} keyStat={keyStat} />
    case 'briefing':
      return <HomeBriefing score={score} pulse={pulse} keyStat={keyStat} />
    case 'signal':
    default:
      return <HomeSignal score={score} pulse={pulse} keyStat={keyStat} />
  }
}
