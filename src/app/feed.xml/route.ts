import { MOCK_COMMENTARIES } from '@/lib/mockData'

export async function GET() {
  const siteUrl = 'https://thehumanindex.org'
  const commentaries = MOCK_COMMENTARIES // In production: fetch from Supabase

  const rssItems = commentaries
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${siteUrl}/pulse/${item.slug}</link>
      <guid isPermaLink="true">${siteUrl}/pulse/${item.slug}</guid>
      <pubDate>${new Date(item.published_at).toUTCString()}</pubDate>
      <description><![CDATA[${item.body_markdown
        .split('\n')
        .find((line) => !line.startsWith('#') && line.trim())
        ?.substring(0, 200) || ''}]]></description>
    </item>`
    )
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Human Index — Weekly Pulse</title>
    <link>${siteUrl}/pulse</link>
    <description>Weekly analysis of AI displacement trends, economic shifts, and civilizational stress indicators.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
