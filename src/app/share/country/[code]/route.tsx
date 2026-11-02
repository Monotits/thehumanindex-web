/**
 * GET /share/country/{iso2}?format=story|square → bold PNG share card.
 * Rendering lives in lib/share/countryCard (also used for the OG image).
 */

import { renderCountryCard } from '@/lib/share/countryCard';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const format = new URL(req.url).searchParams.get('format') === 'square' ? 'square' : 'story';
  return renderCountryCard(code, format);
}
