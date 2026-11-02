import { renderCountryCard } from '@/lib/share/countryCard';

export const runtime = 'edge';
export const alt = 'The Human Index — country stress ranking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same design as the shareable story/square cards (lib/share/countryCard).
export default async function CountryOGImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return renderCountryCard(code, 'og');
}
