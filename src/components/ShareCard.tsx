'use client'

import { QuizResult } from '@/lib/types'
import html2canvas from 'html2canvas'
import { useRef } from 'react'
import { BandLabel } from './BandLabel'

interface ShareCardProps {
  result: QuizResult
}

export function ShareCard({ result }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `the-human-index-${Date.now()}.png`
      link.click()
    } catch (error) {
      console.error('Failed to download card:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-lg p-8 max-w-md mx-auto"
      >
        <div className="text-center space-y-4">
          <h3 className="text-white text-sm font-mono tracking-widest">THE HUMAN INDEX</h3>
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">Exposure Score for</p>
            <p className="text-white text-xl font-bold">{result.share_card_data.job_title}</p>
          </div>
          <div className="py-4">
            <BandLabel band={result.exposure_band} size="lg" />
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-xs">You are in the</p>
            <p className="text-white text-lg font-bold">{result.share_card_data.percentile_text}</p>
          </div>
          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs">{result.share_card_data.region}</p>
          </div>
          <p className="text-gray-600 text-xs">thehumanindex.com</p>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={downloadCard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Download Card
        </button>
        <button
          onClick={() => {
            const url = `https://thehumanindex.com/quiz/result?band=${result.exposure_band}&percentile=${result.percentile}`
            navigator.clipboard.writeText(url)
          }}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Copy Link
        </button>
      </div>
    </div>
  )
}
