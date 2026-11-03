'use client';

import { ShareCardButton } from './ShareCardButton';

/** Country page share card (kept as a thin wrapper so existing imports keep working). */
export function CountryShareCard({ code, name }: { code: string; name: string }) {
  const cc = code.toLowerCase();
  return (
    <ShareCardButton image={`/share/country/${cc}`} page={`/country/${cc}`} title={`Share ${name}`} kind="country" id={code} fileStem={cc} />
  );
}
