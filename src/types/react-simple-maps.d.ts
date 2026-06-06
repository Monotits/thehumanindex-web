// Minimal type shim for react-simple-maps.
//
// In production the real @types/react-simple-maps package (declared in
// devDependencies) provides authoritative types via Vercel's npm install.
// This shim exists only so our local tsc --noEmit can complete in the
// dev sandbox before node_modules has been populated.

declare module 'react-simple-maps' {
  import type { ReactNode, MouseEvent } from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    role?: string;
    'aria-label'?: string;
    children?: ReactNode;
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element;

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Array<Record<string, unknown>> }) => ReactNode;
  }
  export function Geographies(props: GeographiesProps): JSX.Element;

  export interface GeographyProps {
    key?: string;
    geography: Record<string, unknown>;
    onMouseEnter?: (e: MouseEvent<SVGPathElement>) => void;
    onMouseMove?: (e: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (e: MouseEvent<SVGPathElement>) => void;
    onClick?: (e: MouseEvent<SVGPathElement>) => void;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    className?: string;
  }
  export function Geography(props: GeographyProps): JSX.Element;
}
