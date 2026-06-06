'use client';

import { useState } from 'react';
import { cn } from '@/lib/ui/cn';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

const SOCIAL_LINKS = [
  { name: 'X (Twitter)',  handle: '@thehumanindexhq',   url: 'https://x.com/thehumanindexhq' },
  { name: 'Instagram',    handle: '@thehumanindexorg',  url: 'https://www.instagram.com/thehumanindexorg/' },
  { name: 'TikTok',       handle: '@thehumanindexorg',  url: 'https://www.tiktok.com/@thehumanindexorg' },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not send. Try again later.');
      }
      setStatus('sent');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
            Contact
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            Spot something off? Tell us.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl leading-relaxed">
            Corrections, source suggestions, partnership ideas, press requests
            — anything goes. We read everything.
          </p>
        </div>
      </section>

      {/* ── FORM + ALTS ── */}
      <section className="max-w-prose-wide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Form */}
          <form onSubmit={onSubmit} className="lg:col-span-2 space-y-5" noValidate>
            {status === 'sent' && (
              <div className="rounded-lg border border-band-low/30 bg-band-low-bg p-4 text-sm">
                <strong className="text-band-low font-medium">Sent.</strong>{' '}
                <span className="text-foreground-muted">
                  We&apos;ll get back to you within a few days.
                </span>
              </div>
            )}
            {status === 'error' && error && (
              <div className="rounded-lg border border-band-high/30 bg-band-high-bg p-4 text-sm">
                <strong className="text-band-high font-medium">
                  Couldn&apos;t send.
                </strong>{' '}
                <span className="text-foreground-muted">{error}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                label="Your name"
                id="name"
                value={name}
                onChange={setName}
                required
              />
              <Field
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
            </div>

            <Field
              label="Subject"
              id="subject"
              value={subject}
              onChange={setSubject}
            />

            <Field
              label="Message"
              id="message"
              value={message}
              onChange={setMessage}
              required
              textarea
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === 'sending'}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium transition-colors',
                  status === 'sending'
                    ? 'bg-background-alt text-foreground-subtle cursor-wait'
                    : 'bg-accent text-accent-fg hover:bg-accent-hover',
                )}
              >
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>

          {/* Alt contact */}
          <aside className="space-y-8">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium mb-3">
                Email
              </h3>
              <a
                href="mailto:hello@thehumanindex.org"
                className="text-base font-medium hover:underline underline-offset-2 decoration-foreground-subtle/40"
              >
                hello@thehumanindex.org
              </a>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium mb-3">
                Social
              </h3>
              <ul className="space-y-2 text-sm">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground-muted hover:text-foreground"
                    >
                      <span className="font-medium text-foreground">{s.name}</span>{' '}
                      <span className="text-foreground-subtle">· {s.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium mb-3">
                Press
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Reporters can email{' '}
                <a
                  href="mailto:press@thehumanindex.org"
                  className="text-foreground hover:underline underline-offset-2"
                >
                  press@thehumanindex.org
                </a>
                . We typically respond same business day.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

// ── Form field ─────────────────────────────────────────────────────

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  required,
  textarea,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const common =
    'w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-foreground transition-colors';
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-wider text-foreground-muted mb-1.5 font-medium"
      >
        {label}
        {required && <span className="text-band-high/80 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={6}
          className={cn(common, 'resize-y min-h-[140px]')}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={common}
        />
      )}
    </div>
  );
}
