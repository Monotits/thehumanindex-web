'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { cn } from '@/lib/ui/cn';
import {
  bandFor,
  META_INDEXES,
  META_LABELS,
  META_BG_CLASS,
  type MetaIndex,
} from '@/lib/ui/tokens';

// World atlas via jsdelivr CDN — small (~110KB), public/topology, ISO_A2 codes.
const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export interface WorldMapCountry {
  country_code: string;
  name: string;
  flag_emoji: string | null;
  composite: number | null;
  meta: Partial<Record<MetaIndex, number>>;
}

interface WorldMapProps {
  countries: WorldMapCountry[];
  className?: string;
}

interface GeographyProps {
  rsmKey: string;
  properties: {
    name?: string;
    NAME?: string;
    ISO_A2?: string;
    ISO_A2_EH?: string;
    iso_a2?: string;
    [key: string]: unknown;
  };
}

// Numeric → ISO2 lookup for the 25 tracked countries.
// world-atlas 110m uses numeric ISO 3166-1 codes in its `id` field.
// (Adopted from the official ISO 3166-1 list — only the 25 we track.)
const NUMERIC_TO_ISO2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '032': 'AR', '036': 'AU',
  '040': 'AT', '050': 'BD', '056': 'BE', '076': 'BR', '124': 'CA',
  '152': 'CL', '156': 'CN', '170': 'CO', '203': 'CZ', '208': 'DK',
  '218': 'EC', '233': 'EE', '246': 'FI', '250': 'FR', '276': 'DE',
  '300': 'GR', '348': 'HU', '352': 'IS', '356': 'IN', '360': 'ID',
  '364': 'IR', '372': 'IE', '376': 'IL', '380': 'IT', '392': 'JP',
  '410': 'KR', '484': 'MX', '528': 'NL', '554': 'NZ', '566': 'NG',
  '578': 'NO', '586': 'PK', '604': 'PE', '608': 'PH', '616': 'PL',
  '620': 'PT', '643': 'RU', '682': 'SA', '702': 'SG', '710': 'ZA',
  '724': 'ES', '752': 'SE', '756': 'CH', '764': 'TH', '784': 'AE',
  '792': 'TR', '804': 'UA', '826': 'GB', '840': 'US', '858': 'UY',
  '862': 'VE', '704': 'VN',
};

function getIso2(geo: GeographyProps): string | null {
  // Numeric id (world-atlas 110m)
  const numId = (geo as unknown as { id?: string | number }).id;
  if (numId !== undefined) {
    const key = String(numId).padStart(3, '0');
    return NUMERIC_TO_ISO2[key] ?? null;
  }
  // Fallback to properties
  return (
    geo.properties.ISO_A2 ||
    geo.properties.ISO_A2_EH ||
    geo.properties.iso_a2 ||
    null
  );
}

interface HoverState {
  country_code: string;
  x: number;
  y: number;
}

/**
 * Interactive world choropleth — the headline data viz.
 *
 * Coloring: every tracked country is filled with its composite-score
 * stress-band color. Untracked countries are neutral grey.
 *
 * Interaction: hover → animated tooltip card with flag, name,
 * composite, band pill, and 5 meta-index dots. Click → /country/[code].
 *
 * Projection: equal-earth — modern equal-area, looks calm.
 */
export function WorldMap({ countries, className }: WorldMapProps) {
  const router = useRouter();
  const [hover, setHover] = useState<HoverState | null>(null);

  // Build lookup map by ISO2
  const byIso2 = useMemo(() => {
    const m = new Map<string, WorldMapCountry>();
    for (const c of countries) m.set(c.country_code.toUpperCase(), c);
    return m;
  }, [countries]);

  const hoveredCountry = hover ? byIso2.get(hover.country_code) ?? null : null;

  function handleEnter(iso2: string, e: React.MouseEvent) {
    if (!byIso2.has(iso2)) return;
    const target = e.currentTarget as SVGPathElement;
    const svg = target.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setHover({
      country_code: iso2,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleLeave() {
    setHover(null);
  }

  function handleMove(e: React.MouseEvent) {
    if (!hover) return;
    const svg = (e.currentTarget as SVGPathElement).ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setHover((prev) =>
      prev
        ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
        : null,
    );
  }

  function handleClick(iso2: string) {
    if (!byIso2.has(iso2)) return;
    router.push(`/country/${iso2.toLowerCase()}`);
  }

  return (
    <div className={cn('relative w-full', className)}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        width={980}
        height={460}
        style={{ width: '100%', height: 'auto' }}
        role="img"
        aria-label="World map of civilizational stress"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<Record<string, unknown>> }) =>
            (geographies as unknown as GeographyProps[]).map((geo) => {
              const iso2 = getIso2(geo);
              const country = iso2 ? byIso2.get(iso2) : undefined;
              const band = country ? bandFor(country.composite) : null;
              const fill = band
                ? `var(--band-${band})`
                : 'var(--background-alt)';
              const stroke = 'var(--background)';
              const isTracked = !!country;
              const isHovered = hover?.country_code === iso2;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo as unknown as Record<string, unknown>}
                  onMouseEnter={(e) => iso2 && handleEnter(iso2, e)}
                  onMouseMove={(e) => iso2 && handleMove(e)}
                  onMouseLeave={handleLeave}
                  onClick={() => iso2 && handleClick(iso2)}
                  style={{
                    default: {
                      fill,
                      stroke,
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: isTracked ? 'pointer' : 'default',
                      opacity: isTracked ? 0.92 : 0.55,
                      transition: 'opacity 120ms, stroke-width 120ms',
                    },
                    hover: {
                      fill,
                      stroke: isTracked
                        ? 'var(--foreground)'
                        : 'var(--border-strong)',
                      strokeWidth: isTracked ? 1.2 : 0.5,
                      outline: 'none',
                      opacity: isTracked ? 1 : 0.65,
                      cursor: isTracked ? 'pointer' : 'default',
                    },
                    pressed: {
                      fill,
                      stroke: 'var(--foreground)',
                      strokeWidth: 1.2,
                      outline: 'none',
                    },
                  }}
                  className={cn(isHovered && 'drop-shadow-sm')}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip card */}
      {hover && hoveredCountry && (
        <Tooltip x={hover.x} y={hover.y} country={hoveredCountry} />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-foreground-muted">
        <span className="uppercase tracking-wider font-medium text-foreground-subtle">
          Composite scale
        </span>
        {(['low', 'moderate', 'elevated', 'high', 'critical'] as const).map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: `var(--band-${b})` }}
              aria-hidden="true"
            />
            <span className="capitalize">{b}</span>
          </span>
        ))}
        <span className="ml-auto text-foreground-subtle hidden sm:inline">
          Hover any tracked country · click for detail
        </span>
      </div>
    </div>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────

function Tooltip({
  x,
  y,
  country,
}: {
  x: number;
  y: number;
  country: WorldMapCountry;
}) {
  const band = bandFor(country.composite);

  // Position: offset from cursor so it doesn't block the country
  const style: React.CSSProperties = {
    left: x + 16,
    top: y + 16,
    pointerEvents: 'none',
  };

  return (
    <div
      style={style}
      className="absolute z-20 w-64 rounded-lg border border-border bg-background shadow-lg p-4 animate-fade-in"
    >
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl" aria-hidden="true">
          {country.flag_emoji ?? '🏳️'}
        </span>
        <span className="font-serif text-lg font-semibold leading-tight">
          {country.name}
        </span>
      </div>

      {country.composite !== null && (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-mono tabular-nums text-3xl font-semibold">
            {country.composite.toFixed(1)}
          </span>
          {band && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: `var(--band-${band}-bg)`,
                color: `var(--band-${band})`,
              }}
            >
              {band}
            </span>
          )}
        </div>
      )}

      {/* 5 meta dots */}
      <div className="space-y-1">
        {META_INDEXES.map((m) => {
          const v = country.meta[m];
          if (v === undefined) return null;
          const b = bandFor(v);
          return (
            <div key={m} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden="true"
                className={cn('inline-block w-2 h-2 rounded-full', META_BG_CLASS[m])}
              />
              <span className="text-foreground-muted flex-1">{META_LABELS[m]}</span>
              <span
                className="font-mono tabular-nums font-medium"
                style={{ color: b ? `var(--band-${b})` : undefined }}
              >
                {v.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-border text-[10px] uppercase tracking-wider text-foreground-subtle">
        Click for detail →
      </div>
    </div>
  );
}
