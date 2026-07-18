import type { Metadata } from 'next'

// Metadata page.tsx'te tanımlı (tek kaynak) — çift tanım title/og sapmasına
// yol açıyordu. openGraph page.tsx'e taşındı.
export const metadata: Metadata = {}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
