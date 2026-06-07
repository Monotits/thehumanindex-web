import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unsubscribed — The Human Index',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const success = ok === '1';

  return (
    <div className="min-h-screen">
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        {success ? (
          <>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-4 text-balance">
              You&apos;re unsubscribed.
            </h1>
            <p className="text-base sm:text-lg text-foreground-muted text-pretty max-w-xl mx-auto leading-relaxed mb-8">
              We won&apos;t send you any more Weekly Stress Briefs. The live data is
              always at <Link href="/" className="underline underline-offset-2">thehumanindex.org</Link>
              {' '}— come back any time.
            </p>
            <p className="text-sm text-foreground-subtle">
              Changed your mind? You can{' '}
              <Link href="/" className="underline underline-offset-2 hover:text-foreground">
                resubscribe from the homepage
              </Link>{' '}
              and we&apos;ll start the briefs back up.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-4 text-balance">
              We couldn&apos;t find that subscription.
            </h1>
            <p className="text-base sm:text-lg text-foreground-muted text-pretty max-w-xl mx-auto leading-relaxed mb-8">
              The unsubscribe link may have expired or already been used.
              If you&apos;re still receiving emails, reach out and we&apos;ll
              handle it manually.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Contact us
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
