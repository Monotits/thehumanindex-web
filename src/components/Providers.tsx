'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

/**
 * Providers — root client wrapper.
 *
 * Cleaned up for UI Sprint v1:
 *   - Old 3-theme system (terminal/briefing/signal) replaced with
 *     simple light/dark/system via ThemeProvider in @/components/ui.
 *   - Removed forced ThemeSelector modal — users land directly on the site.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider defaultTheme="system">{children}</ThemeProvider>;
}
