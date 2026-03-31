'use client'

import { useState } from 'react'
import { QuizInput } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

export function QuizForm() {
  const router = useRouter()
  const { theme } = useTheme()
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    background: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: 8,
    color: theme.text,
    fontSize: 14,
    fontFamily: theme.fontBody,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: theme.textSecondary,
    marginBottom: 8,
    fontFamily: theme.fontBody,
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Job Title */}
        <div>
          <label style={labelStyle}>Job Title</label>
          <input
            type="text"
            value={formData.job_title}
            onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
            placeholder="e.g., Software Engineer, Data Analyst"
            style={{ ...inputStyle }}
            required
          />
        </div>

        {/* Industry */}
        <div>
          <label style={labelStyle}>Industry</label>
          <input
            type="text"
            value={formData.industry}
            onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            placeholder="e.g., Technology, Finance, Healthcare"
            style={{ ...inputStyle }}
            required
          />
        </div>

        {/* Main Tasks */}
        <div>
          <label style={labelStyle}>Main Tasks &amp; Responsibilities</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={currentTask}
              onChange={e => setCurrentTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
              placeholder="Add a task (press Enter to add)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAddTask}
              style={{
                padding: '10px 20px',
                background: theme.accent,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: theme.fontBody,
                whiteSpace: 'nowrap',
              }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {formData.tasks.map((task, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                padding: '4px 12px',
                borderRadius: 20,
              }}>
                <span style={{ fontSize: 13, color: theme.textSecondary, fontFamily: theme.fontBody }}>{task}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTask(idx)}
                  style={{ background: 'none', border: 'none', color: theme.textTertiary, cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label style={labelStyle}>Years of Experience</label>
          <input
            type="number"
            value={formData.experience_years}
            onChange={e => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
            min="0"
            max="70"
            style={{ ...inputStyle }}
            required
          />
        </div>

        {/* Education */}
        <div>
          <label style={labelStyle}>Education Level</label>
          <select
            value={formData.education_level}
            onChange={e => setFormData(prev => ({ ...prev, education_level: e.target.value as QuizInput['education_level'] }))}
            style={{ ...inputStyle, appearance: 'auto' }}
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
          <label style={labelStyle}>Age Range</label>
          <select
            value={formData.age_range}
            onChange={e => setFormData(prev => ({ ...prev, age_range: e.target.value as QuizInput['age_range'] }))}
            style={{ ...inputStyle, appearance: 'auto' }}
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
          <label style={labelStyle}>Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="e.g., US, UK, Canada"
            style={{ ...inputStyle }}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || formData.tasks.length === 0}
          style={{
            width: '100%',
            padding: '14px 0',
            background: loading || formData.tasks.length === 0 ? theme.surfaceBorder : theme.accent,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading || formData.tasks.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: theme.fontBody,
            opacity: loading || formData.tasks.length === 0 ? 0.5 : 1,
            transition: 'opacity 0.2s, background 0.2s',
          }}
        >
          {loading ? 'Evaluating...' : 'Get Your Exposure Score'}
        </button>
      </div>
    </form>
  )
}
