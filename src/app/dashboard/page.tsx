'use client'

import { useEffect, useState } from 'react'
import { CompositeScore } from '@/lib/types'
import { CompositeGauge } from '@/components/CompositeGauge'
import { SubIndexBar } from '@/components/SubIndexBar'
import { MOCK_COMPOSITE_SCORE } from '@/lib/mockData'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [score, setScore] = useState<CompositeScore | null>(null)
  const [historicalData, setHistoricalData] = useState<{ date: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch latest composite score with sub_indexes
        const { data: scores, error } = await supabase
          .from('composite_scores')
          .select('*, sub_indexes(*)')
          .eq('score_type', 'composite')
          .order('computed_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (scores && scores.length > 0) {
          setScore(scores[0] as CompositeScore)
        } else {
          // Fallback to mock if no data in DB yet
          setScore(MOCK_COMPOSITE_SCORE)
        }

        // Fetch historical scores for trend chart
        const { data: history, error: histError } = await supabase
          .from('composite_scores')
          .select('score_value, computed_at')
          .eq('score_type', 'composite')
          .order('computed_at', { ascending: true })
          .limit(20)

        if (!histError && history && history.length > 0) {
          setHistoricalData(
            history.map((h: { computed_at: string; score_value: number }) => ({
              date: new Date(h.computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: h.score_value,
            }))
          )
        } else {
          // Fallback mock historical
          setHistoricalData([
            { date: 'Week 1', score: 54 },
            { date: 'Week 2', score: 55 },
            { date: 'Week 3', score: 56 },
            { date: 'Week 4', score: 57 },
            { date: 'Week 5', score: 57.5 },
            { date: 'Week 6', score: 58 },
          ])
        }
      } catch (error) {
        console.error('Failed to load score:', error)
        setScore(MOCK_COMPOSITE_SCORE)
        setHistoricalData([
          { date: 'Week 1', score: 54 },
          { date: 'Week 2', score: 55 },
          { date: 'Week 3', score: 56 },
          { date: 'Week 4', score: 57 },
          { date: 'Week 5', score: 57.5 },
          { date: 'Week 6', score: 58 },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading || !score) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // Compute domain changes for "What Changed" section
  const domainChanges = score.sub_indexes?.map(sub => ({
    domain: sub.domain,
    value: sub.value,
  })) || []

  return (
    <div className="bg-gray-950 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Real-time monitoring of civilization&apos;s structural stability</p>
        </div>

        {/* Composite Score */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-12">
          <h2 className="text-lg font-semibold text-gray-400 mb-8">COMPOSITE INDEX</h2>
          <div className="flex justify-center">
            <CompositeGauge score={score} />
          </div>
          <div className="text-center text-sm text-gray-500 mt-8">
            Last updated: {formatDate(score.computed_at)}
          </div>
        </div>

        {/* Sub-Indices Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">Domain Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {score.sub_indexes?.map(subIndex => (
              <div key={subIndex.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <SubIndexBar subIndex={subIndex} />
              </div>
            ))}
          </div>
        </div>

        {/* Historical Trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-12">
          <h2 className="text-lg font-semibold text-gray-400 mb-8">HISTORICAL TREND</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Domain Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h2 className="text-lg font-semibold text-gray-400 mb-8">DOMAIN SCORES</h2>
          <div className="space-y-6">
            {domainChanges.map(dc => {
              const color = dc.value >= 65 ? 'bg-red-500' : dc.value >= 45 ? 'bg-orange-500' : dc.value >= 25 ? 'bg-blue-500' : 'bg-green-500'
              return (
                <div key={dc.domain} className="flex gap-4">
                  <div className={`w-2 h-12 ${color} rounded-full`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {dc.domain.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — {dc.value.toFixed(1)}
                    </h3>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${Math.min(dc.value, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
