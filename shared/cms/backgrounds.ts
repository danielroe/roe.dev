/**
 * Background styles for the generated AMA image. Pure CSS property bags;
 * Vue's `:style` binding accepts them as-is.
 */

export interface BackgroundStyle {
  id: string
  title: string
  /** Noun phrase describing the background, used to build image alt text. */
  description: string
  /** Tone of the background, which decides whether overlaid text is light or dark. */
  tone?: 'light' | 'dark'
  style: Record<string, string | number>
}

/** Colour and shadow for text drawn directly on the background (footer, CTA). */
export function getForegroundStyle (background: BackgroundStyle, size: 'sm' | 'lg' = 'sm'): { color: string, textShadow: string } {
  const offset = size === 'lg' ? '0 4px 8px' : '0 2px 4px'
  return background.tone === 'light'
    ? { color: '#0f172a', textShadow: `${offset} rgba(255, 255, 255, 0.85)` }
    : { color: '#ffffff', textShadow: `${offset} rgba(0, 0, 0, 0.5)` }
}

const NOISE_FILTER = 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMCI+IDxmaWx0ZXIgaWQ9Im15RmlsdGVyIj4gPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9Ii4wMDUgLjAwMSIgbnVtT2N0YXZlcz0iMiIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIHhDaGFubmVsU2VsZWN0b3I9IlIiIHNjYWxlPSI1MDAiIGluPSJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImJhbmRzIiAvPiA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMy43MSIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIGluPSJiYW5kcyIgc2NhbGU9IjMyIiB4Q2hhbm5lbFNlbGVjdG9yPSJSIiAvPiA8L2ZpbHRlcj4gPC9zdmc+#myFilter")'

export interface EmojiBackgroundOptions {
  /** Emoji to scatter. Each tile picks from these at random. */
  emojis: string[]
  /** CSS background painted beneath the emoji layer. */
  base: string
  /** Size of the repeating tile, in px. */
  tile?: number
  /** How many emoji to place per tile. */
  count?: number
  /** Seed for the deterministic scatter, so a given id always renders identically. */
  seed?: number
  /** Min/max emoji size as a fraction of the tile. */
  scale?: [number, number]
  opacity?: number
}

function seededRandom (seed: number) {
  let state = seed % 233280
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

/**
 * Builds a repeating SVG tile of randomly placed, sized and tilted emoji as a
 * CSS property bag. The data URI is percent-encoded rather than base64 because
 * `btoa` cannot handle the astral-plane codepoints emoji live in.
 */
export function createEmojiBackground (options: EmojiBackgroundOptions): Record<string, string> {
  const {
    emojis,
    base,
    tile = 320,
    count = 10,
    seed = 1,
    scale = [0.12, 0.22],
    opacity = 1,
  } = options

  const next = seededRandom(seed || 1)
  const nodes: string[] = []

  for (let i = 0; i < count; i++) {
    const emoji = emojis[Math.floor(next() * emojis.length)] ?? emojis[0]!
    const size = Math.round((scale[0] + next() * (scale[1] - scale[0])) * tile)
    const x = Math.round(next() * tile)
    const y = Math.round(next() * tile)
    const rotation = Math.round((next() * 60) - 30)
    // Draw each emoji four times, offset by ±tile, so glyphs that overhang an
    // edge reappear on the opposite side and the tile stays seamless.
    for (const dx of [0, x > tile / 2 ? -tile : tile]) {
      for (const dy of [0, y > tile / 2 ? -tile : tile]) {
        nodes.push(
          `<text x="${x + dx}" y="${y + dy}" font-size="${size}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rotation} ${x + dx} ${y + dy})">${emoji}</text>`,
        )
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}"><g opacity="${opacity}">${nodes.join('')}</g></svg>`

  return {
    background: base,
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}"), ${base}`,
    backgroundSize: `${tile}px ${tile}px, cover`,
    backgroundRepeat: 'repeat, no-repeat',
  }
}

export const BACKGROUND_STYLES: readonly BackgroundStyle[] = [
  {
    id: 'noise-gradient',
    title: 'Noise gradient (default)',
    description: 'a grainy yellow-to-fuchsia-to-blue gradient',
    style: {
      background: 'linear-gradient(yellow 5%, fuchsia, royalblue 95%)',
      filter: NOISE_FILTER,
    },
  },
  {
    id: 'aurora',
    title: 'Aurora',
    description: 'a teal-to-lime aurora gradient',
    style: {
      background: 'linear-gradient(135deg, #0f4c5c 0%, #14b8a6 40%, #84cc16 100%)',
    },
  },
  {
    id: 'sunset',
    title: 'Sunset',
    description: 'an amber-to-pink sunset gradient',
    style: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 45%, #be185d 100%)',
    },
  },
  {
    id: 'mesh',
    title: 'Mesh',
    description: 'a dark mesh gradient of indigo, pink and teal blooms',
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
    id: 'geese',
    title: 'Cute geese',
    description: 'a pastel background scattered with goose, swan and egg emoji',
    tone: 'light',
    style: createEmojiBackground({
      emojis: ['🪿', '🦢', '🥚'],
      base: 'linear-gradient(135deg, #fef3c7 0%, #bae6fd 55%, #c7d2fe 100%)',
      seed: 42,
      count: 12,
    }),
  },
  {
    id: 'solid-dark',
    title: 'Solid dark',
    description: 'a solid dark navy background',
    style: {
      background: '#0f172a',
    },
  },
  {
    id: 'solid-light',
    title: 'Solid light',
    description: 'a solid off-white background',
    tone: 'light',
    style: {
      background: '#f8fafc',
    },
  },
] as const

export const DEFAULT_BACKGROUND_STYLE_ID = 'noise-gradient'

/** Ids of the form `emoji:🪿🦢` scatter arbitrary emoji instead of naming a preset. */
export const CUSTOM_EMOJI_PREFIX = 'emoji:'

const CUSTOM_EMOJI_BASE = 'linear-gradient(135deg, #fef3c7 0%, #bae6fd 55%, #c7d2fe 100%)'

/** Splits a string into grapheme clusters, so multi-codepoint emoji survive intact. */
export function parseEmojiList (input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return [...segmenter.segment(trimmed)].map(s => s.segment).filter(s => s.trim())
}

/**
 * Serialises emoji into a background id. Capped at 8 emoji because the
 * `backgroundStyle` lexicon field allows 64 bytes and emoji cost up to 4 each.
 */
export function customEmojiBackgroundId (emojis: string): string {
  return `${CUSTOM_EMOJI_PREFIX}${parseEmojiList(emojis).slice(0, 8).join('')}`
}

function listToProse (items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function customEmojiBackground (id: string): BackgroundStyle | undefined {
  const emojis = parseEmojiList(id.slice(CUSTOM_EMOJI_PREFIX.length))
  if (!emojis.length) return undefined

  return {
    id,
    title: `Custom emoji (${emojis.join('')})`,
    description: `a pastel background scattered with ${listToProse(emojis)} emoji`,
    tone: 'light',
    style: createEmojiBackground({
      emojis,
      base: CUSTOM_EMOJI_BASE,
      // Seeding from the emoji themselves keeps a given id rendering identically
      // between the editor preview and any later regeneration.
      seed: [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1,
      count: 12,
    }),
  }
}

export function getBackgroundStyle (id: string | undefined): BackgroundStyle {
  if (id?.startsWith(CUSTOM_EMOJI_PREFIX)) {
    const custom = customEmojiBackground(id)
    if (custom) return custom
  }

  return (
    BACKGROUND_STYLES.find(s => s.id === id)
    ?? BACKGROUND_STYLES.find(s => s.id === DEFAULT_BACKGROUND_STYLE_ID)
    ?? BACKGROUND_STYLES[0]!
  )
}

/** Alt text for a generated AMA image: the question plus a note on the background. */
export function getImageAltText (question: string, backgroundStyleId?: string): string {
  const trimmed = question.trim()
  const { description } = getBackgroundStyle(backgroundStyleId)
  return `${trimmed}${/[.!?]$/.test(trimmed) ? '' : '.'} Text on ${description}.`
}
