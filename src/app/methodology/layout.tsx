import type { Metadata } from 'next'

// Metadata page.tsx'te tanımlı (tek kaynak) — burada tekrar tanımlamak
// title/description/og'nin birbirinden sapmasına yol açıyordu.
export const metadata: Metadata = {}

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
