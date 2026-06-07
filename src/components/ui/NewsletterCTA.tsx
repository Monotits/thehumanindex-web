'use client';

import { useState } from 'react';
import { cn } from '@/lib/ui/cn';
import { trackNewsletterSubscribe } from '@/lib/analytics';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface NewsletterCTAProps {
  /**
   * Layout variant:
   *   - 'hero'    : large editorial card with serif headline (homepage)
   *   - 'inline'  : compact in-article block (Pulse reader)
   *   - 'footer'  : tight one-line form (footer / sidebar)
   */
  variant?: 'hero' | 'inline' | 'footer';
  className?: string;
}

/**
 * Newsletter signup CTA — wraps /api/subscribe.
 *
 * Three variants for three placements:
 *   - hero    : the centerpiece on the homepage
 *   - inline  : at the end of a Pulse article
 *   - footer  : tight, single-line, for site footer
 *
 * Same submission logic everywhere. Success/error states render inline.
 */
export function NewsletterCTA({ variant = 'hero', className }: NewsletterCTAProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'submitting') return;
    setState('submitting');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not subscribe. Try again later.');
      }
      setState('success');
      trackNewsletterSubscribe(variant, email);
      setEmail('');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-background-alt/40 px-6 py-10 sm:px-12 sm:py-14',
          className,
        )}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted font-medium mb-3">
            Weekly stress brief
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-balance">
            Five minutes a week. Every social, economic, and technological stress signal worth knowing.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-foreground-muted text-pretty">
            One email every Sunday. The data, the movements, the framing — distilled.
          </p>

          <Form
            email={email}
            onChange={setEmail}
            onSubmit={submit}
            state={state}
            errorMsg={errorMsg}
            placeholder="you@example.com"
            buttonLabel="Subscribe"
            layout="stacked"
          />

          <p className="mt-4 text-[11px] text-foreground-subtle">
            No spam. Unsubscribe in one click.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-background-alt/30 p-6',
          className,
        )}
      >
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="flex-1 min-w-[240px]">
            <h3 className="font-serif text-lg sm:text-xl font-semibold leading-snug mb-2">
              Get the weekly stress brief
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Each Sunday: the indicators that moved, what to make of them, and which countries to watch.
            </p>
          </div>
          <Form
            email={email}
            onChange={setEmail}
            onSubmit={submit}
            state={state}
            errorMsg={errorMsg}
            placeholder="you@example.com"
            buttonLabel="Subscribe"
            layout="inline"
          />
        </div>
      </div>
    );
  }

  // footer
  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-2 font-serif">
        Weekly brief
      </h3>
      <p className="text-xs text-foreground-muted mb-3 leading-relaxed">
        The stress signals that moved this week, every Sunday.
      </p>
      <Form
        email={email}
        onChange={setEmail}
        onSubmit={submit}
        state={state}
        errorMsg={errorMsg}
        placeholder="you@example.com"
        buttonLabel="Subscribe"
        layout="footer"
      />
    </div>
  );
}

// ── Form ───────────────────────────────────────────────────────────

function Form({
  email,
  onChange,
  onSubmit,
  state,
  errorMsg,
  placeholder,
  buttonLabel,
  layout,
}: {
  email: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  state: FormState;
  errorMsg: string | null;
  placeholder: string;
  buttonLabel: string;
  layout: 'stacked' | 'inline' | 'footer';
}) {
  const sizing =
    layout === 'footer'
      ? 'text-sm px-3 py-2'
      : layout === 'stacked'
        ? 'text-base px-4 py-3'
        : 'text-sm px-3 py-2.5';

  const buttonSize =
    layout === 'footer'
      ? 'text-sm px-4 py-2'
      : layout === 'stacked'
        ? 'text-base px-6 py-3'
        : 'text-sm px-5 py-2.5';

  if (state === 'success') {
    return (
      <div
        className={cn(
          'rounded-md border border-band-low/30 bg-band-low-bg px-4 py-3 text-sm',
          layout === 'stacked' ? 'mt-6 text-center' : 'mt-2',
        )}
      >
        <strong className="text-band-low font-medium">You&apos;re in.</strong>{' '}
        <span className="text-foreground-muted">
          Check your inbox for a confirmation.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'flex gap-2',
        layout === 'stacked' ? 'mt-6 flex-col sm:flex-row max-w-md mx-auto' : 'flex-row min-w-[260px]',
      )}
      noValidate
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Email address"
        disabled={state === 'submitting'}
        className={cn(
          'flex-1 min-w-0 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-foreground transition-colors',
          sizing,
        )}
      />
      <button
        type="submit"
        disabled={state === 'submitting'}
        className={cn(
          'rounded-md font-medium transition-colors shrink-0',
          state === 'submitting'
            ? 'bg-background-alt text-foreground-subtle cursor-wait'
            : 'bg-accent text-accent-fg hover:bg-accent-hover',
          buttonSize,
        )}
      >
        {state === 'submitting' ? 'Sending…' : buttonLabel}
      </button>
      {state === 'error' && errorMsg && (
        <div
          role="alert"
          className={cn(
            'text-xs text-band-high',
            layout === 'stacked' ? 'mt-2 sm:w-full sm:text-center' : 'mt-2',
          )}
        >
          {errorMsg}
        </div>
      )}
    </form>
  );
}
