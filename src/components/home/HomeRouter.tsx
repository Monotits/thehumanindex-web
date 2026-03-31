'use client'

import { useTheme } from '@/lib/theme'
import { CompositeScore, Commentary } from '@/lib/types'
import HomeTerminal from './HomeTerminal'
import HomeBriefing from './HomeBriefing'
import HomeSignal from './HomeSignal'

interface Props {
  score: CompositeScore
  pulse: Commentary
}

export default function HomeRouter({ score, pulse }: Props) {
  const { themeId } = useTheme()

  switch (themeId) {
    case 'terminal':
      return <HomeTerminal score={score} pulse={pulse} />
    case 'briefing':
      return <HomeBriefing score={score} pulse={pulse} />
    case 'signal':
    default:
      return <HomeSignal score={score} pulse={pulse} />
  }
}
