'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

/** "Share card" button + modal: story/square PNG, native share (mobile), download, copy link. */
export function CountryShareCard({ code, name }: { code: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const cc = code.toLowerCase();
  const img = `/share/country/${cc}?format=${format}`;
  const page = `https://thehumanindex.org/country/${cc}`;
  const file = `thehumanindex-${cc}-${format}.png`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const getFile = async () => {
    const blob = await (await fetch(img)).blob();
    return new File([blob], file, { type: 'image/png' });
  };

  const share = async () => {
    setBusy(true); setMsg(null);
    try {
      const f = await getFile();
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], title: `${name} — The Human Index`, text: page });
        trackEvent('share_card', { action: 'native', country: code, format });
      } else {
        download(f);
      }
    } catch {
      /* user cancelled */
    } finally { setBusy(false); }
  };

  const download = async (f?: File) => {
    const blob = f ?? (await getFile());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    trackEvent('share_card', { action: 'download', country: code, format });
    setMsg('Saved — attach it to your post or story.');
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(page); setMsg('Link copied.'); trackEvent('share_card', { action: 'copy_link', country: code }); } catch { /* ignore */ }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); trackEvent('share_card', { action: 'open', country: code }); }}
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
        Share card
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Share card" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-background border border-border p-5 max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold">Share {name}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-foreground-muted hover:text-foreground text-sm">Close</button>
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
            <img src={img} alt={`${name} share card`} className={`mx-auto rounded-lg border border-border ${format === 'story' ? 'max-h-[52vh]' : 'max-h-[40vh]'} w-auto`} />
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
