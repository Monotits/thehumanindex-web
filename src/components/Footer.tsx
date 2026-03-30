'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">The Human Index</h3>
            <p className="text-gray-400 text-sm">Tracking civilization&apos;s proximity to irreversible AI-driven structural transformation.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/methodology" className="hover:text-gray-300 transition-colors">Methodology</Link></li>
              <li><Link href="/pulse" className="hover:text-gray-300 transition-colors">Weekly Pulse</Link></li>
              <li><Link href="/quiz" className="hover:text-gray-300 transition-colors">Assessment</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-gray-300 transition-colors">Disclaimer</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-gray-300 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-gray-300 transition-colors">Email</a></li>
              <li><a href="#" className="hover:text-gray-300 transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} The Human Index. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
