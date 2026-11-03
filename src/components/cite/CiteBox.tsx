'use client';

import { DATASET_CONCEPT_DOI, doiUrl } from '@/lib/seo/doi';
import { useState } from 'react';

interface Props {
  /** e.g. "Turkey — civilizational stress score" */
  title: string;
  url: string;
  /** Accessed date (ISO); defaults to today. */
  accessed?: string;
}

/** "Cite this" — APA 7 + BibTeX with copy buttons. */
export function CiteBox({ title, url, accessed }: Props) {
  const d = accessed ? new Date(accessed) : new Date();
  const year = d.getUTCFullYear();
  const long = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const iso = d.toISOString().slice(0, 10);
  const key = `thi${year}${title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20)}`;
  const apa = `The Human Index. (${year}). ${title} [Data set]. Retrieved ${long}, from ${url}. Archived release: ${doiUrl(DATASET_CONCEPT_DOI)}`;
  const bib = `@misc{${key},\n  author       = {{The Human Index}},\n  title        = {${title}},\n  year         = {${year}},\n  howpublished = {\\url{${url}}},\n  doi          = {${DATASET_CONCEPT_DOI}},\n  note         = {Data set. Accessed ${iso}. CC BY-NC 4.0}\n}`;
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard blocked — the text stays selectable */
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background-alt/30 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted mb-3">Cite this</h3>
      {[{ label: 'APA', text: apa }, { label: 'BibTeX', text: bib }].map(c => (
        <div key={c.label} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-foreground-subtle">{c.label}</span>
            <button
              type="button"
              onClick={() => copy(c.label, c.text)}
              className="text-xs underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground text-foreground-muted"
            >
              {copied === c.label ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words text-xs font-mono bg-background rounded-md border border-border p-3 select-all">{c.text}</pre>
        </div>
      ))}
    </div>
  );
}
