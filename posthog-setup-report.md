<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into The Human Index Next.js App Router project.

## Summary of changes

- **`instrumentation-client.ts`** (new) — PostHog client-side initialization using the Next.js 15.3+ `instrumentation-client` pattern, with a reverse proxy host (`/ingest`), `defaults: '2026-01-30'`, and exception capture enabled.
- **`next.config.mjs`** — Added PostHog reverse proxy rewrites (`/ingest/*` → `us.i.posthog.com`) and `skipTrailingSlashRedirect: true`.
- **`src/lib/analytics.ts`** — Removed the old `initAnalytics()` function; initialization is now handled by `instrumentation-client.ts`. Existing event helpers (`trackThemeChange`, `trackFirstVisitTheme`, `trackThemeSession`, `trackEvent`) are preserved.
- **`src/components/Providers.tsx`** — Removed `initAnalytics` import and its `useEffect` call.
- **`src/lib/posthog-server.ts`** (new) — Server-side PostHog client using `posthog-node` with `flushAt: 1` / `flushInterval: 0` for immediate event flushing in Next.js API routes.
- **`.env.local`** — `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `quiz_submitted` | User submits the AI exposure quiz with job details | `src/components/QuizForm.tsx` |
| `quiz_result_viewed` | User views their quiz result (top of share/subscribe funnel) | `src/app/quiz/result/page.tsx` |
| `quiz_result_email_submitted` | User submits email in the result page modal; also calls `posthog.identify()` | `src/app/quiz/result/page.tsx` |
| `quiz_result_email_skipped` | User skips the email capture modal | `src/app/quiz/result/page.tsx` |
| `newsletter_subscribed` | User successfully subscribes to the newsletter; also calls `posthog.identify()` | `src/components/SubscribeForm.tsx` |
| `contact_form_submitted` | User successfully submits the contact form; also calls `posthog.identify()` | `src/app/contact/page.tsx` |
| `share_card_opened` | User opens the share card modal | `src/components/share/ShareButton.tsx` |
| `share_card_downloaded` | User downloads their share card as PNG | `src/components/share/ShareCardModal.tsx` |
| `share_card_copied` | User copies their share card to clipboard | `src/components/share/ShareCardModal.tsx` |
| `quiz_evaluated` | **Server-side** — AI exposure quiz evaluated and result returned | `src/app/api/quiz/evaluate/route.ts` |
| `newsletter_subscription_created` | **Server-side** — Newsletter subscription saved; also calls server-side `identify()` | `src/app/api/subscribe/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/370158/dashboard/1432995
- **Quiz Conversion Funnel** (quiz_submitted → quiz_result_viewed → quiz_result_email_submitted): https://us.posthog.com/project/370158/insights/taK2nhl2
- **Newsletter Subscriptions Over Time**: https://us.posthog.com/project/370158/insights/busPheik
- **Share Card Download Funnel** (share_card_opened → share_card_downloaded): https://us.posthog.com/project/370158/insights/hqIVvaPK
- **Quiz Result Email Modal Outcome** (submitted vs skipped): https://us.posthog.com/project/370158/insights/Uljz4yuj
- **Key Engagement Events Overview** (quizzes, subscriptions, contact forms): https://us.posthog.com/project/370158/insights/G0sCL2RU

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
