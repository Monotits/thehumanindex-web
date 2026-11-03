'use client';

import { useEffect, useState } from 'react';
import { trackEvent, withUtm } from '@/lib/analytics';

export interface ShareCardButtonProps {
  /** Image route without the format param, e.g. "/share/top10/most-stressed-countries". May contain a query string. */
  image: string;
  /** Page path the post should link to, e.g. "/top-10/most-stressed-countries". */
  page: string;
  /** Dialog heading + native share title. */
  title: string;
  /** Analytics: which surface + id. */
  kind: string;
  id?: string;
  /** Downloaded file name stem. */
  fileStem: string;
  label?: string;
  variant?: 'outline' | 'solid';
}

/** "Share card" button + modal: story/square PNG, native share (mobile), download, copy link. */
export function ShareCardButton({ image, page, title, kind, id, fileStem, label = 'Share card', variant = 'outline' }: ShareCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const img = `${image}${image.includes('?') ? '&' : '?'}format=${format}`;
  const pageUrl = withUtm(`https://thehumanindex.org${page}`, 'share_card', kind);
  const file = `thehumanindex-${fileStem}-${format}.png`;
  const ev = (action: string, extra: Record<string, string> = {}) => trackEvent('share_card', { action, kind, ...(id ? { id } : {}), ...extra });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const getFile = async () => {
    const res = await fetch(img);
    if (!res.ok) throw new Error('card unavailable');
    return new File([await res.blob()], file, { type: 'image/png' });
  };

  const download = async (f?: File) => {
    try {
      const blob = f ?? (await getFile());
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      ev('download', { format });
      setMsg('Saved — attach it to your post or story.');
    } catch {
      setMsg('Could not create the image. Try again in a moment.');
    }
  };

  const share = async () => {
    setBusy(true); setMsg(null);
    try {
      const f = await getFile();
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], title: `${title} — The Human Index`, text: pageUrl });
        ev('native', { format });
      } else {
        await download(f);
      }
    } catch {
      /* cancelled or unavailable */
    } finally { setBusy(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(pageUrl); setMsg('Link copied.'); ev('copy_link'); } catch { /* ignore */ }
  };

  const btn = variant === 'solid'
    ? 'inline-flex items-center gap-2 rounded-md bg-accent text-accent-fg px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors'
    : 'inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors';

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setMsg(null); ev('open'); }} className={btn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Share card" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-background border border-border p-5 max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-serif text-xl font-semibold leading-tight">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-foreground-muted hover:text-foreground text-sm shrink-0">Close</button>
            </div>
            <div className="flex gap-2 mb-4">
              {(['story', 'square'] as const).map(f => (
                <button key={f} type="button" onClick={() => { setFormat(f); setMsg(null); }}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${format === f ? 'border-foreground text-foreground' : 'border-border text-foreground-muted'}`}>
                  {f === 'story' ? 'Story 9:16' : 'Square 1:1'}
                </button>
              ))}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`${title} share card`} className={`mx-auto rounded-lg border border-border ${format === 'story' ? 'max-h-[52vh]' : 'max-h-[40vh]'} w-auto`} />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button type="button" onClick={share} disabled={busy} className="rounded-md bg-accent text-accent-fg px-3 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-60">Share</button>
              <button type="button" onClick={() => download()} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background-alt">Download</button>
              <button type="button" onClick={copy} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background-alt">Copy link</button>
            </div>
            {msg && <p className="mt-3 text-xs text-foreground-muted text-center">{msg}</p>}
          </div>
        </div>
      )}
    </>
  );
}
