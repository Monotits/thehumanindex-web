/**
 * Load a Google Font as TTF for next/og. Google serves TTF when the request
 * has no modern browser User-Agent. Returns null on any failure so the card
 * still renders with the default font.
 */
const cache = new Map<string, Promise<ArrayBuffer | null>>();

export function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      try {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`)).text();
        const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
        if (!url) return null;
        const res = await fetch(url);
        return res.ok ? await res.arrayBuffer() : null;
      } catch {
        return null;
      }
    })());
  }
  return cache.get(key)!;
}
