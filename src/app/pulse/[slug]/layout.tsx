import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const { data } = await supabase
    .from('commentary')
    .select('title, published_at')
    .eq('slug', slug)
    .single()

  if (!data) {
    return { title: 'Pulse Report' }
  }

  const title = data.title || `Weekly Pulse — ${slug}`
  const description =
    'Weekly analysis of civilizational stress signals across economic, social, and institutional domains.'

  return {
    title,
    description,
    openGraph: {
      title: `${title} — The Human Index`,
      description,
      url: `https://thehumanindex.org/pulse/${slug}`,
      type: 'article',
      ...(data.published_at && { publishedTime: data.published_at }),
    },
    alternates: {
      canonical: `https://thehumanindex.org/pulse/${slug}`,
    },
    // Weekly AI-drafted country briefings (25 near-identical templates a week).
    // Google left 61 of them "discovered – not indexed" (GSC 2026-11-09); as
    // scaled templated content they risk dragging down site-wide quality and
    // eat crawl budget the country/indicator pages need. Readable and linked,
    // not indexed.
    robots: { index: false, follow: true },
  }
}

export default function PulseSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
