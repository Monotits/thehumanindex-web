'use client'

import { useEffect, useState } from 'react'
import { CompositeScore } from '@/lib/types'
import { CompositeGauge } from '@/components/CompositeGauge'
import { SubIndexBar } from '@/components/SubIndexBar'
import { MOCK_COMPOSITE_SCORE } from '@/lib/mockData'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [score, setScore] = useState<CompositeScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to fetch from Supabase, fall back to mock data
    const loadScore = async () => {
      try {
        // In production, would fetch from Supabase
        // const { data } = await supabase
        //   .from('composite_scores')
        //   .select('*, sub_indexes(*)')
        //   .eq('score_type', 'composite')
        //   .order('computed_at', { ascending: false })
        //   .limit(1)

        // For now use mock
        setScore(MOCK_COMPOSITE_SCORE)
      } catch (error) {
        console.error('Failed to load score:', error)
        setScore(MOCK_COMPOSITE_SCORE)
      } finally {
        setLoading(false)
      }
    }

    loadScore()
  }, [])

  if (loading || !score) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // Mock historical data
  const historicalData = [
    { date: 'Week 1', score: 54 },
    { date: 'Week 2', score: 55 },
    { date: 'Week 3', score: 56 },
    { date: 'Week 4', score: 57 },
    { date: 'Week 5', score: 57.5 },
    { date: 'Week 6', score: 58 },
  ]

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

        {/* What Changed This Week */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h2 className="text-lg font-semibold text-gray-400 mb-8">WHAT CHANGED THIS WEEK</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-2 h-12 bg-orange-500 rounded-full" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">AI Work Displacement +2.1</h3>
                <p className="text-sm text-gray-400">Enterprise adoption accelerating across tech sector</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-12 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Income Inequality +1.8</h3>
                <p className="text-sm text-gray-400">Wage pressure on routine cognitive work</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-12 bg-red-500 rounded-full" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Social Unrest +0.9</h3>
                <p className="text-sm text-gray-400">Increased labor union activity and demonstrations</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-12 bg-green-500 rounded-full" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Policy Response -0.5</h3>
                <p className="text-sm text-gray-400">Regulatory framework development lagging</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
