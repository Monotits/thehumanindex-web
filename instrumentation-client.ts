import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
})

// ── Answer-engine traffic (GEO) ─────────────────────────────────────
// Visits referred by AI assistants get an `ai_source` super property for the
// session plus one `ai_referral_landing` event, so they can be counted and
// followed without regex filters on $referrer in every insight.
const AI_REFERRERS: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'gemini'],
  [/(^|\.)copilot\.microsoft\.com$|(^|\.)bing\.com$/, 'copilot_bing'],
  [/(^|\.)you\.com$|(^|\.)phind\.com$|(^|\.)kagi\.com$/, 'other_ai_search'],
  [/(^|\.)deepseek\.com$|(^|\.)grok\.com$|(^|\.)x\.ai$|(^|\.)meta\.ai$/, 'other_ai'],
]
try {
  const ref = document.referrer ? new URL(document.referrer).hostname : ''
  const utm = new URLSearchParams(location.search).get('utm_source') ?? ''
  const hit = AI_REFERRERS.find(([re]) => re.test(ref)) ?? (/chatgpt|perplexity/i.test(utm) ? [null, utm.toLowerCase()] as const : null)
  if (hit) {
    posthog.register_for_session({ ai_source: hit[1] })
    posthog.register_once({ first_ai_source: hit[1] })
    posthog.capture('ai_referral_landing', { ai_source: hit[1], referrer_host: ref, landing_path: location.pathname })
  }
} catch { /* never break the page for analytics */ }

// ── Named events for actions autocapture only sees as generic clicks ──
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null
  if (!a?.href) return
  try {
    const u = new URL(a.href, location.href)
    if (u.origin === location.origin && u.pathname === '/api/export') {
      posthog.capture('csv_downloaded', { dataset: u.searchParams.get('dataset') ?? 'scores', country: u.searchParams.get('country'), page: location.pathname })
    } else if (u.hostname === 'doi.org' || u.hostname === 'zenodo.org') {
      posthog.capture('doi_clicked', { href: u.href, page: location.pathname })
    } else if (u.origin !== location.origin && /^https?:$/.test(u.protocol)) {
      posthog.capture('outbound_clicked', { host: u.hostname, page: location.pathname })
    }
  } catch { /* ignore */ }
}, { capture: true })
