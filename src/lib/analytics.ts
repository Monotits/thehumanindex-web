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
