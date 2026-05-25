import type { CSSProperties } from 'react'

export interface BackgroundStyle {
  id: string
  title: string
  style: CSSProperties
}

const NOISE_FILTER = 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMCI+IDxmaWx0ZXIgaWQ9Im15RmlsdGVyIj4gPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9Ii4wMDUgLjAwMSIgbnVtT2N0YXZlcz0iMiIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIHhDaGFubmVsU2VsZWN0b3I9IlIiIHNjYWxlPSI1MDAiIGluPSJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImJhbmRzIiAvPiA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMy43MSIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIGluPSJiYW5kcyIgc2NhbGU9IjMyIiB4Q2hhbm5lbFNlbGVjdG9yPSJSIiAvPiA8L2ZpbHRlcj4gPC9zdmc+#myFilter")'

export const BACKGROUND_STYLES: readonly BackgroundStyle[] = [
  {
    id: 'noise-gradient',
    title: 'Noise gradient (default)',
    style: {
      background: 'linear-gradient(yellow 5%, fuchsia, royalblue 95%)',
      filter: NOISE_FILTER,
    },
  },
  {
    id: 'aurora',
    title: 'Aurora',
    style: {
      background: 'linear-gradient(135deg, #0f4c5c 0%, #14b8a6 40%, #84cc16 100%)',
    },
  },
  {
    id: 'sunset',
    title: 'Sunset',
    style: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 45%, #be185d 100%)',
    },
  },
  {
    id: 'mesh',
    title: 'Mesh',
    style: {
      background: [
        'radial-gradient(at 20% 20%, #6366f1 0px, transparent 50%)',
        'radial-gradient(at 80% 0%, #ec4899 0px, transparent 50%)',
        'radial-gradient(at 80% 80%, #14b8a6 0px, transparent 50%)',
        'radial-gradient(at 0% 100%, #f59e0b 0px, transparent 50%)',
        '#0f172a',
      ].join(', '),
    },
  },
  {
    id: 'solid-dark',
    title: 'Solid dark',
    style: {
      background: '#0f172a',
    },
  },
  {
    id: 'solid-light',
    title: 'Solid light',
    style: {
      background: '#f8fafc',
    },
  },
] as const

export const DEFAULT_BACKGROUND_STYLE_ID = 'noise-gradient'

export function getBackgroundStyle (id: string | undefined): BackgroundStyle {
  return (
    BACKGROUND_STYLES.find(s => s.id === id)
    ?? BACKGROUND_STYLES.find(s => s.id === DEFAULT_BACKGROUND_STYLE_ID)
    ?? BACKGROUND_STYLES[0]!
  )
}
