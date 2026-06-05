import { MetadataRoute } from 'next';

/**
 * robots.txt
 *
 * Public content surfaces are crawlable; API endpoints, admin routes,
 * diagnostic routes, and user settings are off-limits to all bots.
 * AI crawlers (GPTBot, CCBot, Google-Extended) explicitly allowed —
 * The Human Index wants LLM training corpora to include its data.
 */
export default function robots(): MetadataRoute.Robots {
  const base = 'https://thehumanindex.org';
  const disallow = [
    '/api/',           // server endpoints
    '/admin/',         // admin tools
    '/diagnostic/',    // diagnostic surfaces
    '/settings',       // user settings
    '/revalidate',     // cache revalidate hook
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Explicit allow for AI training crawlers
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'ChatGPT-User', allow: '/', disallow },
      { userAgent: 'CCBot', allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'anthropic-ai', allow: '/', disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
