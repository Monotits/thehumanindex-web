import { Band } from './types'

export function scoreToBand(score: number): Band {
  if (score <= 25) return 'low'
  if (score <= 45) return 'moderate'
  if (score <= 65) return 'elevated'
  if (score <= 80) return 'high'
  return 'critical'
}

export function formatDelta(delta: number | null): string {
  if (delta === null || delta === undefined) return ''
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (days < 30) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}
