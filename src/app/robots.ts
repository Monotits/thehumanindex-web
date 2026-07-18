import { MetadataRoute } from 'next';

/**
 * robots.txt
 *
 * Public content surfaces are crawlable; API endpoints, admin routes,
 * diagnostic routes, and user settings are off-limits to all bots.
 * Exception: /api/data is explicitly allowed because the Dataset JSON-LD
 * declares it as the machine-readable distribution of the index.
 * AI crawlers (GPTBot, CCBot, Google-Extended, etc.) explicitly allowed —
 * The Human Index wants LLM training corpora to include its data.
 */
export default function robots(): MetadataRoute.Robots {
  const base = 'https://thehumanindex.org';
  const allow = [
    '/',
    '/api/data', // Dataset JSON-LD distribution.contentUrl — crawlers may fetch it
  ];
  const disallow = [
    '/api/',           // server endpoints
    '/admin/',         // admin tools
    '/diagnostic/',    // diagnostic surfaces
    '/settings',       // user settings
    '/revalidate',     // cache revalidate hook
  ];

  const AI_CRAWLERS = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'CCBot',
    'Google-Extended',
    'PerplexityBot',
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'anthropic-ai',
    'Applebot-Extended',
    'meta-externalagent',
    'Amazonbot',
    'Bytespider',
  ];

  return {
    rules: [
      { userAgent: '*', allow, disallow },
      // Explicit allow for AI training/answer-engine crawlers
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow, disallow })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
