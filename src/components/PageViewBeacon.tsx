'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

interface PageViewBeaconProps {
  /** Event name to fire (e.g. 'indicator_viewed', 'topic_viewed'). */
  event: string;
  /** Properties to attach to the event. */
  properties?: Record<string, unknown>;
}

/**
 * Fires a named PostHog event with extra properties on mount.
 *
 * PostHog autocapture already records $pageview for every URL change,
 * but the autopilot event only carries the raw URL path. For dynamic
 * routes (`/indicator/[id]`, `/topics/[slug]`, `/country/[code]`,
 * `/top-10/[slug]`) we want the slug / id / code as a first-class
 * property so dashboards can filter / group on it cleanly.
 *
 * Drop this near the root of any server page:
 *   <PageViewBeacon event="indicator_viewed" properties={{ indicator_id: id }} />
 *
 * Runs once per mount. Safe under React strict-mode double-render.
 */
export function PageViewBeacon({ event, properties }: PageViewBeaconProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      posthog.capture(event, properties ?? {});
    } catch {
      /* swallow */
    }
    // We want this to fire only once per mount even if properties
    // object identity changes between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
