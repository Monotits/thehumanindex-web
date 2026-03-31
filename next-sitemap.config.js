/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://thehumanindex.org',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/quiz/result'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://thehumanindex.org/sitemap-pulse.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/quiz/result', '/_next/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
    ],
  },
  transform: async (config, path) => {
    // Custom priority per page
    const priorities = {
      '/': 1.0,
      '/quiz': 0.9,
      '/methodology': 0.9,
      '/dashboard': 0.8,
      '/pulse': 0.7,
    }

    const changefreqs = {
      '/': 'weekly',
      '/quiz': 'monthly',
      '/methodology': 'monthly',
      '/dashboard': 'weekly',
      '/pulse': 'weekly',
    }

    return {
      loc: path,
      changefreq: changefreqs[path] || (path.startsWith('/pulse/') ? 'weekly' : 'monthly'),
      priority: priorities[path] || (path.startsWith('/pulse/') ? 0.8 : 0.5),
      lastmod: new Date().toISOString(),
    }
  },
}
