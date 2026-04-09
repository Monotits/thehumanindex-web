import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with The Human Index team. Questions about our methodology, partnership inquiries, press requests, or feedback — we\'d love to hear from you.',
  openGraph: {
    title: 'Contact — The Human Index',
    description:
      'Reach the team behind The Human Index for press, research collaboration, data access, or general inquiries.',
    url: 'https://thehumanindex.org/contact',
  },
  alternates: {
    canonical: 'https://thehumanindex.org/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
