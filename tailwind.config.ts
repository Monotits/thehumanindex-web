import type { Config } from "tailwindcss";

/**
 * The Human Index — Tailwind Configuration
 *
 * Renk tokens'leri CSS variable referansı olarak tutuluyor (globals.css'te
 * tanımlı). Bu sayede dark mode toggle CSS değişkenleri değiştirerek
 * çalışıyor, Tailwind class'larında değişiklik gerekmiyor.
 */

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
        mono: ['var(--font-plex-mono)', '"SF Mono"', 'Consolas', 'monospace'],
        editorial: ['var(--font-newsreader)', 'Georgia', 'serif'],
      },
      colors: {
        // ── Surface tokens ──
        background:        'var(--background)',
        'background-alt':  'var(--background-alt)',
        foreground:        'var(--foreground)',
        'foreground-muted':'var(--foreground-muted)',
        'foreground-subtle':'var(--foreground-subtle)',
        border:            'var(--border)',
        'border-strong':   'var(--border-strong)',
        accent:            'var(--accent)',
        'accent-fg':       'var(--accent-fg)',
        'accent-hover':    'var(--accent-hover)',
        link:              'var(--link)',
        'link-hover':      'var(--link-hover)',

        // ── Meta-index categorical (5 categories) ──
        meta: {
          economic:        'var(--meta-economic)',
          social:          'var(--meta-social)',
          mental:          'var(--meta-mental)',
          technological:   'var(--meta-technological)',
          environmental:   'var(--meta-environmental)',
        },

        // ── Stress band scale ──
        band: {
          low:        'var(--band-low)',
          moderate:   'var(--band-moderate)',
          elevated:   'var(--band-elevated)',
          high:       'var(--band-high)',
          critical:   'var(--band-critical)',
          'low-bg':       'var(--band-low-bg)',
          'moderate-bg':  'var(--band-moderate-bg)',
          'elevated-bg':  'var(--band-elevated-bg)',
          'high-bg':      'var(--band-high-bg)',
          'critical-bg':  'var(--band-critical-bg)',
        },

        // ── Freshness ──
        freshness: {
          fresh:      'var(--freshness-fresh)',
          aging:      'var(--freshness-aging)',
          stale:      'var(--freshness-stale)',
          'very-stale':'var(--freshness-very-stale)',
        },

        // ── Confidence ──
        confidence: {
          verified: 'var(--confidence-verified)',
          reported: 'var(--confidence-reported)',
          rumored:  'var(--confidence-rumored)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        // Editorial reader uygun: 65-75 char width @ 18px Newsreader ≈ 36rem
        prose: '36rem',
        // Wide reading: 80ch
        'prose-wide': '42rem',
        // Page content max
        screen: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
