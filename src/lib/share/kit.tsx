/**
 * Shared building blocks for the bold share cards (next/og):
 * palette, fonts, canvas sizes and the common header/footer.
 * Every card states only numbers that are published on the site.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadGoogleFont } from './font';

export const C = {
  bg: '#0B0B0D', panel: '#17171B', fg: '#F5F3EE', muted: '#A5A29B', dim: '#55534F',
  hot: '#FF5A36', warm: '#FFA62B', calm: '#3DDC97', mid: '#D9D3C7',
};

export type ShareFormat = 'story' | 'square';

export function parseFormat(req: Request): ShareFormat {
  return new URL(req.url).searchParams.get('format') === 'square' ? 'square' : 'story';
}

export function canvas(format: ShareFormat) {
  const story = format === 'story';
  return { story, W: 1080, H: story ? 1920 : 1080, pad: story ? 84 : 72 };
}

export function anonClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

export async function cardFonts() {
  const [black, bold] = await Promise.all([loadGoogleFont('Inter', 900), loadGoogleFont('Inter', 600)]);
  const fonts = [
    ...(black ? [{ name: 'Inter', data: black, weight: 900 as const, style: 'normal' as const }] : []),
    ...(bold ? [{ name: 'Inter', data: bold, weight: 600 as const, style: 'normal' as const }] : []),
  ];
  return fonts.length ? fonts : undefined;
}

export function cardOptions(format: ShareFormat, fonts: Awaited<ReturnType<typeof cardFonts>>) {
  const { W, H } = canvas(format);
  return { width: W, height: H, fonts, headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } };
}

export function monthLabel(d = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

export function Glow({ format, color }: { format: ShareFormat; color: string }) {
  const { W, H } = canvas(format);
  return <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', backgroundImage: `radial-gradient(circle at 85% 12%, ${color}40 0%, ${color}00 55%)` }} />;
}

export function TopBar({ format, right }: { format: ShareFormat; right: string }) {
  const { story } = canvas(format);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: story ? 26 : 24, color: C.muted, letterSpacing: 3, fontWeight: 600 }}>
      <div style={{ display: 'flex' }}>THE HUMAN INDEX</div>
      <div style={{ display: 'flex' }}>{right}</div>
    </div>
  );
}

export function Footer({ format, hook, accent, note, path }: { format: ShareFormat; hook: string; accent: string; note?: string; path?: string }) {
  const { story } = canvas(format);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
      <div style={{ display: 'flex', fontSize: story ? 58 : 44, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05 }}>{hook}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
        <div style={{ display: 'flex', fontSize: story ? 40 : 34, color: accent, fontWeight: 900 }}>{`thehumanindex.org${path ?? ''}`}</div>
        {note && <div style={{ display: 'flex', fontSize: 22, color: C.dim }}>{note}</div>}
      </div>
    </div>
  );
}

export function notFound(): Response {
  return new Response('Not found', { status: 404 });
}
