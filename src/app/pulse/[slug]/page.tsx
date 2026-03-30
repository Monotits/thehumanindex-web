'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Commentary } from '@/lib/types'
import { MOCK_COMMENTARIES } from '@/lib/mockData'
import { formatDate } from '@/lib/utils'
import { useParams } from 'next/navigation'

export default function PulseDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [commentary, setCommentary] = useState<Commentary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to fetch from Supabase, fall back to mock
    const loadCommentary = async () => {
      try {
        // In production:
        // const { data } = await supabase
        //   .from('commentaries')
        //   .select('*')
        //   .eq('slug', slug)
        //   .single()

        const found = MOCK_COMMENTARIES.find(c => c.slug === slug)
        setCommentary(found || null)
      } catch (error) {
        console.error('Failed to load commentary:', error)
        setCommentary(null)
      } finally {
        setLoading(false)
      }
    }

    loadCommentary()
  }, [slug])

  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!commentary) {
    return (
      <div className="bg-gray-950 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white mb-4">Pulse not found</h1>
          <Link href="/pulse" className="text-blue-500 hover:text-blue-400">
            Back to Pulse
          </Link>
        </div>
      </div>
    )
  }

  // Render markdown as simple HTML (for production, use a markdown library)
  const sections = commentary.body_markdown.split('\n').map((line, idx) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-3xl font-bold text-white mt-8 mb-4">
          {line.replace(/^# /, '')}
        </h1>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-2xl font-bold text-white mt-6 mb-3">
          {line.replace(/^## /, '')}
        </h2>
      )
    }
    if (line.startsWith('- ')) {
      return (
        <li key={idx} className="text-gray-400 ml-6 mb-2">
          {line.replace(/^- /, '')}
        </li>
      )
    }
    if (line.trim()) {
      return (
        <p key={idx} className="text-gray-400 mb-4">
          {line}
        </p>
      )
    }
    return null
  })

  return (
    <div className="bg-gray-950 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link href="/pulse" className="text-blue-500 hover:text-blue-400 mb-8 inline-flex items-center gap-2">
          ← Back to Pulse
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{commentary.title}</h1>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <time>{formatDate(commentary.published_at)}</time>
            <span>Weekly Pulse Report</span>
          </div>
        </div>

        {/* Content */}
        <article className="bg-gray-900 border border-gray-800 rounded-lg p-8 prose prose-invert max-w-none">
          <div className="space-y-4">
            {sections}
          </div>
        </article>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex justify-between">
          <Link href="/pulse" className="text-gray-400 hover:text-gray-300">
            ← Previous Pulses
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-300">
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  )
}
