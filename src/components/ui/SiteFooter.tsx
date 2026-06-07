import Link from 'next/link';
import { NewsletterCTA } from './NewsletterCTA';

/**
 * SiteFooter — UI Sprint Plan v1
 *
 * 4-column footer + bottom trust strip.
 *
 * Columns:
 *   1. About / The project
 *   2. Data & methodology
 *   3. Content / explore
 *   4. Trust / contact
 *
 * Bottom strip: copyright, license badge, AI crawler-friendly note.
 */

const SOURCES = [
  'World Bank',
  'Eurostat',
  'IMF WEO',
  'OECD',
  'WRI Aqueduct',
  'WHO',
  'IHME GBD',
  'Berkeley Earth',
  'Gallup',
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background-alt/30 mt-16">
      {/* Footer newsletter band — high visibility */}
      <div className="border-b border-border">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-3xl">
            <NewsletterCTA variant="footer" />
          </div>
        </div>
      </div>

      <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1 — About */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 font-serif">The Project</h3>
            <ul className="space-y-2 text-sm text-foreground-muted">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/methodology" className="hover:text-foreground">Methodology</Link></li>
              <li><Link href="/transparency" className="hover:text-foreground">Transparency</Link></li>
              <li>
                <a
                  href="https://github.com/Monotits/thehumanindex-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  Source code
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 — Data */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 font-serif">Data</h3>
            <ul className="space-y-2 text-sm text-foreground-muted">
              <li><Link href="/countries" className="hover:text-foreground">Countries (25)</Link></li>
              <li><Link href="/indicators" className="hover:text-foreground">Indicators (31)</Link></li>
              <li><Link href="/top-10" className="hover:text-foreground">Country rankings</Link></li>
              <li><Link href="/countries?view=table" className="hover:text-foreground">Sortable table</Link></li>
              <li><Link href="/data-sources" className="hover:text-foreground">Data sources</Link></li>
              <li><Link href="/api/transparency" className="hover:text-foreground">API access</Link></li>
            </ul>
          </div>

          {/* Column 3 — Content */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 font-serif">Read</h3>
            <ul className="space-y-2 text-sm text-foreground-muted">
              <li><Link href="/pulse" className="hover:text-foreground">Pulse — weekly</Link></li>
              <li><Link href="/research" className="hover:text-foreground">Research</Link></li>
              <li><Link href="/glossary" className="hover:text-foreground">Glossary</Link></li>
              <li><a href="/feed.xml" className="hover:text-foreground">RSS feed</a></li>
            </ul>
            <h3 className="text-sm font-semibold text-foreground mt-6 mb-3 font-serif">Tools</h3>
            <ul className="space-y-2 text-sm text-foreground-muted">
              <li><Link href="/quiz" className="hover:text-foreground">Personal exposure quiz</Link></li>
              <li><Link href="/layoffs" className="hover:text-foreground">Labor stress signals</Link></li>
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 font-serif">Contact</h3>
            <ul className="space-y-2 text-sm text-foreground-muted">
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li>
                <a href="mailto:hello@thehumanindex.org" className="hover:text-foreground">
                  hello@thehumanindex.org
                </a>
              </li>
              <li>
                <a href="mailto:press@thehumanindex.org" className="hover:text-foreground">
                  press@thehumanindex.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Source attribution strip */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="text-xs text-foreground-subtle mb-3 uppercase tracking-wide font-medium">
            Powered by data from
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground-muted">
            {SOURCES.map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-foreground-subtle">
          <div>
            © {new Date().getFullYear()} The Human Index. Data CC BY-NC 4.0. Code MIT.
          </div>
          <div className="flex items-center gap-3">
            <span>Cron refreshes every 12h</span>
            <span aria-hidden="true">·</span>
            <span>25 countries · 31 indicators</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
