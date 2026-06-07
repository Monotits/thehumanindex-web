import posthog from 'posthog-js'

// PostHog is initialized via instrumentation-client.ts (Next.js 15.3+)

// Track theme selection for A/B analysis
export function trackThemeChange(theme: string) {
  if (typeof window === 'undefined') return
  posthog.capture('theme_changed', { theme })
  posthog.people.set({ preferred_theme: theme })
}

// Track first visit theme selection
export function trackFirstVisitTheme(theme: string) {
  if (typeof window === 'undefined') return
  posthog.capture('first_visit_theme_selected', { theme })
}

// Track active theme on each page view for usage analysis
export function trackThemeSession(theme: string) {
  if (typeof window === 'undefined') return
  posthog.capture('theme_session', { active_theme: theme })
  posthog.people.set({ current_theme: theme })
}

// Track generic events
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, properties)
}

// ── UI Sprint conversion events ──────────────────────────────────
// Each function below corresponds to a measurable user action on
// the new growth surfaces. snake_case keys for dashboard consistency.

export function trackNewsletterSubscribe(variant: 'hero' | 'inline' | 'footer', email?: string) {
  if (typeof window === 'undefined') return
  posthog.capture('newsletter_subscribed', { variant })
  if (email) posthog.identify(email, { email })
}

export function trackLanguageChange(from: string, to: string) {
  if (typeof window === 'undefined') return
  posthog.capture('language_changed', { from, to })
  posthog.people.set({ preferred_locale: to })
}

export function trackQuizCompleted(opts: {
  country: string
  sector: string
  age: string
  concerns: string[]
  personalExposure: number | null
}) {
  if (typeof window === 'undefined') return
  posthog.capture('quiz_completed', {
    country: opts.country,
    sector: opts.sector,
    age: opts.age,
    concerns: opts.concerns,
    concern_count: opts.concerns.length,
    personal_exposure: opts.personalExposure,
  })
}

export function trackCountryClick(country_code: string, source: string) {
  if (typeof window === 'undefined') return
  posthog.capture('country_clicked', { country_code, source })
}

export function trackTopicView(slug: string) {
  if (typeof window === 'undefined') return
  posthog.capture('topic_viewed', { slug })
}

export function trackTop10View(slug: string) {
  if (typeof window === 'undefined') return
  posthog.capture('top_10_viewed', { slug })
}

export function trackIndicatorView(indicator_id: string) {
  if (typeof window === 'undefined') return
  posthog.capture('indicator_viewed', { indicator_id })
}
