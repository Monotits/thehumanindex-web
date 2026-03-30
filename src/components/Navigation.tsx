'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home', exact: true },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/quiz', label: 'Quiz' },
    { href: '/pulse', label: 'Pulse' },
    { href: '/methodology', label: 'Methodology' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">
            The Human Index
          </Link>
          <div className="flex items-center gap-8">
            {links.map(({ href, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
