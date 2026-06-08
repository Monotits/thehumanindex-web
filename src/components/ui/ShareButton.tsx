'use client';

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

// ──────────────────────────────────────────────────────
// ShareButton — Faz 21
//
// One-tap link share for any page on The Human Index. Two modes:
//
//   1. Mobile (Web Share API supported): tapping the button opens the
//      OS-native share sheet (iOS/Android), letting users pick any app
//      they have installed. Zero design surface to maintain.
//
//   2. Desktop (no navigator.share): clicking opens a small popover with
//      Copy link + 5 destinations (Twitter/X, LinkedIn, Reddit, WhatsApp,
//      Email). Each link uses the OG share card we already generate.
//
// Every share fires a PostHog 'share_clicked' event with `surface` so we
// can see which pages drive shares.
//
// Visual treatment: subtle text button styled like the existing chip-style
// nav links. Doesn't compete with the page content.
// ──────────────────────────────────────────────────────

interface ShareButtonProps {
  /** The path to share (absolute or pathname). If pathname, we'll prefix the canonical origin. */
  url: string;
  /** Headline used in OS share sheet + Twitter/LinkedIn pre-fill */
  title: string;
  /** Optional one-line summary for share-sheet text body */
  text?: string;
  /** Where this button lives — fires as the `surface` event property */
  surface: string;
  /** Optional className override for the trigger button */
  className?: string;
  /** Compact = icon only, full = "Share" text + icon. Defaults to 'full'. */
  variant?: 'compact' | 'full';
}

const CANONICAL_ORIGIN = 'https://thehumanindex.org';

function absoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${CANONICAL_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function ShareButton({
  url,
  title,
  text,
  surface,
  className = '',
  variant = 'full',
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fullUrl = absoluteUrl(url);
  const shareText = text ?? title;

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (
        popRef.current &&
        !popRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ─── Handlers ──────────────────────────────────
  const handleClick = async () => {
    // Try Web Share API first (mobile + some desktop)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: fullUrl });
        trackEvent('share_clicked', { surface, channel: 'native', url: fullUrl });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to popover.
        // navigator.share throws AbortError on cancel; we don't track that.
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    setOpen((o) => !o);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      trackEvent('share_clicked', { surface, channel: 'copy_link', url: fullUrl });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard write can fail (insecure context); show URL inline
      window.prompt('Copy this link:', fullUrl);
    }
  };

  const trackChannel = (channel: string) => {
    trackEvent('share_clicked', { surface, channel, url: fullUrl });
    setOpen(false);
  };

  // ─── Share URLs ────────────────────────────────
  const enc = encodeURIComponent;
  const channels = [
    {
      key: 'twitter',
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(fullUrl)}`,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(fullUrl)}`,
    },
    {
      key: 'reddit',
      label: 'Reddit',
      href: `https://www.reddit.com/submit?url=${enc(fullUrl)}&title=${enc(title)}`,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${enc(`${title} ${fullUrl}`)}`,
    },
    {
      key: 'email',
      label: 'Email',
      href: `mailto:?subject=${enc(title)}&body=${enc(`${shareText}\n\n${fullUrl}`)}`,
    },
  ];

  // ─── Render ────────────────────────────────────
  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share this page"
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-background-alt text-sm text-foreground-muted hover:text-foreground transition-colors'
        }
      >
        <ShareIcon className="w-4 h-4" />
        {variant === 'full' && <span>Share</span>}
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          aria-label="Share options"
          className="absolute right-0 mt-2 w-56 z-50 rounded-lg border border-border bg-background shadow-lg p-1.5"
        >
          <button
            role="menuitem"
            onClick={handleCopy}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-foreground hover:bg-background-alt flex items-center justify-between"
          >
            <span>{copied ? 'Copied ✓' : 'Copy link'}</span>
            <span className="text-xs text-foreground-subtle font-mono truncate ml-2 max-w-[120px]">
              {fullUrl.replace(/^https?:\/\//, '')}
            </span>
          </button>
          <div className="my-1 border-t border-border" />
          {channels.map((c) => (
            <a
              key={c.key}
              role="menuitem"
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackChannel(c.key)}
              className="block px-3 py-2 rounded-md text-sm text-foreground hover:bg-background-alt"
            >
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="5" cy="10" r="2" />
      <circle cx="15" cy="4.5" r="2" />
      <circle cx="15" cy="15.5" r="2" />
      <path d="M6.7 9 13.3 5.5" />
      <path d="M6.7 11l6.6 3.5" />
    </svg>
  );
}
