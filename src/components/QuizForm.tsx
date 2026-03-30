'use client'

import { useState } from 'react'
import { QuizInput } from '@/lib/types'
import { useRouter } from 'next/navigation'

export function QuizForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<QuizInput>({
    job_title: '',
    industry: '',
    tasks: [],
    experience_years: 5,
    education_level: 'bachelors',
    country: 'US',
    age_range: '25-34',
  })
  const [currentTask, setCurrentTask] = useState('')

  const handleAddTask = () => {
    if (currentTask.trim()) {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, currentTask],
      }))
      setCurrentTask('')
    }
  }

  const handleRemoveTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to evaluate quiz')

      const result = await response.json()

      // Store result in session storage and redirect
      sessionStorage.setItem('quizResult', JSON.stringify(result))
      router.push('/quiz/result')
    } catch (error) {
      console.error('Quiz submission error:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
          <input
            type="text"
            value={formData.job_title}
            onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
            placeholder="e.g., Software Engineer, Data Analyst"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
          <input
            type="text"
            value={formData.industry}
            onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            placeholder="e.g., Technology, Finance, Healthcare"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Main Tasks */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Main Tasks & Responsibilities</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentTask}
              onChange={e => setCurrentTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
              placeholder="Add a task (press Enter to add)"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-sm text-gray-300">{task}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTask(idx)}
                  className="text-gray-500 hover:text-gray-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
          <input
            type="number"
            value={formData.experience_years}
            onChange={e => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
            min="0"
            max="70"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
          <select
            value={formData.education_level}
            onChange={e => setFormData(prev => ({ ...prev, education_level: e.target.value as Record<string, unknown> }))}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            required
          >
            <option value="high_school">High School</option>
            <option value="bachelors">Bachelor&apos;s Degree</option>
            <option value="masters">Master&apos;s Degree</option>
            <option value="phd">PhD</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Age Range</label>
          <select
            value={formData.age_range}
            onChange={e => setFormData(prev => ({ ...prev, age_range: e.target.value as Record<string, unknown> }))}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            required
          >
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55+">55+</option>
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="e.g., US, UK, Canada"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || formData.tasks.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
        >
          {loading ? 'Evaluating...' : 'Get Your Exposure Score'}
        </button>
      </div>
    </form>
  )
}
