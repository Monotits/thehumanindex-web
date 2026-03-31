'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Commentary } from '@/lib/types'
import { MOCK_COMMENTARIES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

export default function PulsePage() {
  const [commentaries, setCommentaries] = useState<Commentary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCommentaries = async () => {
      try {
        const { data, error } = await supabase
          .from('commentary')
          .select('*')
          .eq('type', 'weekly_pulse')
          .order('published_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          setCommentaries(data as Commentary[])
        } else {
          setCommentaries(MOCK_COMMENTARIES)
        }
      } catch (error) {
        console.error('Failed to load commentaries:', error)
        setCommentaries(MOCK_COMMENTARIES)
      } finally {
        setLoading(false)
      }
    }

    loadCommentaries()
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-950 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Weekly Pulse</h1>
          <p className="text-gray-400">
            AI-generated analysis and insights on civilization&apos;s structural stability
          </p>
        </div>

        {/* Commentaries List */}
        <div className="space-y-6">
          {commentaries.map(commentary => {
            const excerpt = commentary.body_markdown
              .split('\n')
              .find(line => !line.startsWith('#') && line.trim())
              ?.substring(0, 150)

            return (
              <Link key={commentary.id} href={`/pulse/${commentary.slug}`}>
                <div className="group bg-gray-900 border border-gray-800 rounded-lg p-8 hover:border-blue-700 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {commentary.title}
                    </h2>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {timeAgo(commentary.published_at)}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {excerpt}...
                  </p>
                  <div className="text-blue-500 group-hover:text-blue-400 font-medium transition-colors">
                    Read Full Analysis →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {commentaries.length === 0 && (
          <div className="text-center text-gray-400">
            <p>No pulse reports yet. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
