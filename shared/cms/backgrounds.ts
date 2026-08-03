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

export interface GradientPreset {
  id: string
  title: string
  /** Noun phrase describing the gradient, used to build image alt text. */
  description: string
  css: string
  tone: 'light' | 'dark'
}

export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  {
    id: 'pastel',
    title: 'Pastel',
    description: 'a pastel cream-to-lilac gradient',
    css: 'linear-gradient(135deg, #fef3c7 0%, #bae6fd 55%, #c7d2fe 100%)',
    tone: 'light',
  },
  {
    id: 'sunset',
    title: 'Sunset',
    description: 'an amber-to-pink sunset gradient',
    css: 'linear-gradient(135deg, #fbbf24 0%, #f97316 45%, #be185d 100%)',
    tone: 'dark',
  },
  {
    id: 'aurora',
    title: 'Aurora',
    description: 'a teal-to-lime aurora gradient',
    css: 'linear-gradient(135deg, #0f4c5c 0%, #14b8a6 40%, #84cc16 100%)',
    tone: 'dark',
  },
  {
    id: 'candy',
    title: 'Candy',
    description: 'a pink-to-violet candy gradient',
    css: 'linear-gradient(135deg, #fbcfe8 0%, #f0abfc 50%, #a5b4fc 100%)',
    tone: 'light',
  },
  {
    id: 'midnight',
    title: 'Midnight',
    description: 'a deep indigo-to-navy gradient',
    css: 'linear-gradient(135deg, #312e81 0%, #1e293b 60%, #0f172a 100%)',
    tone: 'dark',
  },
  {
    id: 'mint',
    title: 'Mint',
    description: 'a mint-to-sky gradient',
    css: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 45%, #bfdbfe 100%)',
    tone: 'light',
  },
] as const

export const DEFAULT_GRADIENT_ID = 'pastel'

function gradientPreset (id: string): GradientPreset {
  return GRADIENT_PRESETS.find(g => g.id === id) ?? GRADIENT_PRESETS[0]!
}

const HEX_COLOUR = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i

function expandHex (hex: string): string {
  return hex.length === 3 ? hex.replace(/./g, c => c + c) : hex
}

/** Relative luminance, used to decide whether overlaid text should be dark. */
function luminance (hex: string): number {
  const value = expandHex(hex)
  const [r, g, b] = [0, 2, 4].map(i => Number.parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number]
  const channel = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Serialises a custom gradient into the compact form used inside background
 * ids: an angle in degrees, then two or more hex colours without their `#`.
 */
export function customGradientSpec (angle: number, colours: string[]): string {
  const hexes = colours
    .map(c => c.replace(/^#/, '').toLowerCase())
    .filter(c => HEX_COLOUR.test(c))
    .slice(0, 4)
  if (hexes.length < 2) return DEFAULT_GRADIENT_ID
  return `${Math.round(angle) % 360}:${hexes.join('-')}`
}

export interface ParsedGradient {
  css: string
  tone: 'light' | 'dark'
  description: string
  /** Present when the spec named a preset rather than listing colours. */
  presetId?: string
  angle: number
  colours: string[]
}

/** Resolves a gradient spec: either a preset id or `<angle>:<hex>-<hex>[-…]`. */
export function parseGradient (spec: string | undefined): ParsedGradient | undefined {
  if (!spec) return undefined

  const preset = GRADIENT_PRESETS.find(g => g.id === spec)
  if (preset) {
    return {
      css: preset.css,
      tone: preset.tone,
      description: preset.description,
      presetId: preset.id,
      angle: 135,
      colours: [...preset.css.matchAll(/#[0-9a-f]{6}/gi)].map(m => m[0]),
    }
  }

  const [rawAngle, rawColours] = spec.split(':')
  const angle = Number.parseInt(rawAngle ?? '', 10)
  const hexes = (rawColours ?? '').split('-').filter(c => HEX_COLOUR.test(c))
  if (!Number.isFinite(angle) || hexes.length < 2) return undefined

  const colours = hexes.map(h => `#${expandHex(h).toLowerCase()}`)
  const stops = colours.map((colour, i) => `${colour} ${Math.round((i / (colours.length - 1)) * 100)}%`)
  const averageLuminance = hexes.reduce((total, hex) => total + luminance(hex), 0) / hexes.length

  return {
    css: `linear-gradient(${angle}deg, ${stops.join(', ')})`,
    tone: averageLuminance > 0.45 ? 'light' : 'dark',
    description: 'a custom gradient',
    angle,
    colours,
  }
}

export interface EmojiBackgroundOptions {
  /** Emoji to scatter. Each tile picks from these at random. */
  emojis: string[]
  /** CSS background painted beneath the emoji layer. */
  base: string
  /**
   * Size of the repeating tile, in px. Defaults to a tile larger than the
   * rendered canvas so the scatter never visibly repeats within an image.
   */
  tile?: number
  /** Average area, in px², given over to each emoji. Lower means denser. */
  density?: number
  /** How many emoji to place per tile. Derived from `density` when omitted. */
  count?: number
  /** Seed for the deterministic scatter, so a given id always renders identically. */
  seed?: number
  /** Min/max emoji size, in px. */
  size?: [number, number]
  opacity?: number
}

/**
 * Wider than the 1200px capture plus its `-9em` bleed on both sides, and
 * taller than any question we render, so one tile covers the whole image.
 */
const DEFAULT_TILE = 2600
const DEFAULT_DENSITY = 8500

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
    tile = DEFAULT_TILE,
    density = DEFAULT_DENSITY,
    count = Math.max(1, Math.round((tile * tile) / density)),
    seed = 1,
    size: [minSize, maxSize] = [38, 70],
    opacity = 1,
  } = options

  const next = seededRandom(seed || 1)
  const nodes: string[] = []

  for (let i = 0; i < count; i++) {
    const emoji = emojis[Math.floor(next() * emojis.length)] ?? emojis[0]!
    const size = Math.round(minSize + next() * (maxSize - minSize))
    const x = Math.round(next() * tile)
    const y = Math.round(next() * tile)
    const rotation = Math.round((next() * 60) - 30)
    // Glyphs that overhang an edge are drawn again on the opposite side so the
    // tile stays seamless; only the ones actually near an edge need the copy.
    const xs = x < size ? [0, tile] : x > tile - size ? [0, -tile] : [0]
    const ys = y < size ? [0, tile] : y > tile - size ? [0, -tile] : [0]
    for (const dx of xs) {
      for (const dy of ys) {
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
    description: gradientPreset('aurora').description,
    style: {
      background: gradientPreset('aurora').css,
    },
  },
  {
    id: 'sunset',
    title: 'Sunset',
    description: gradientPreset('sunset').description,
    style: {
      background: gradientPreset('sunset').css,
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
      base: gradientPreset(DEFAULT_GRADIENT_ID).css,
      seed: 42,
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

/**
 * Ids of the form `emoji:🪿🦢|sunset` scatter arbitrary emoji over a chosen
 * gradient instead of naming a preset. Both halves are optional: the gradient
 * defaults to `pastel`, and omitting the emoji gives a plain gradient.
 */
export const CUSTOM_EMOJI_PREFIX = 'emoji:'

const GRADIENT_SEPARATOR = '|'

/** Splits a string into grapheme clusters, so multi-codepoint emoji survive intact. */
export function parseEmojiList (input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return [...segmenter.segment(trimmed)].map(s => s.segment).filter(s => s.trim())
}

/** Byte budget for the `backgroundStyle` lexicon field. */
const MAX_ID_BYTES = 128

/**
 * Serialises emoji and a gradient spec into a background id. Emoji are dropped
 * from the end until the id fits the lexicon field, since a single cluster can
 * cost 28 bytes (tag sequences like 🏴󠁧󠁢󠁳󠁣󠁴󠁿) and the gradient half a further 30.
 */
export function customEmojiBackgroundId (emojis: string, gradient: string = DEFAULT_GRADIENT_ID): string {
  const suffix = gradient && gradient !== DEFAULT_GRADIENT_ID ? `${GRADIENT_SEPARATOR}${gradient}` : ''
  const list = parseEmojiList(emojis).slice(0, 8)

  const encoder = new TextEncoder()
  while (list.length && encoder.encode(`${CUSTOM_EMOJI_PREFIX}${list.join('')}${suffix}`).length > MAX_ID_BYTES) {
    list.pop()
  }

  return `${CUSTOM_EMOJI_PREFIX}${list.join('')}${suffix}`
}

/** Splits a custom background id back into its emoji and gradient halves. */
export function parseCustomBackgroundId (id: string): { emojis: string, gradient: string } {
  const body = id.slice(CUSTOM_EMOJI_PREFIX.length)
  const separator = body.indexOf(GRADIENT_SEPARATOR)
  return separator === -1
    ? { emojis: body, gradient: DEFAULT_GRADIENT_ID }
    : { emojis: body.slice(0, separator), gradient: body.slice(separator + 1) }
}

function listToProse (items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function customEmojiBackground (id: string): BackgroundStyle | undefined {
  const parsed = parseCustomBackgroundId(id)
  const emojis = parseEmojiList(parsed.emojis)
  const gradient = parseGradient(parsed.gradient) ?? parseGradient(DEFAULT_GRADIENT_ID)!

  if (!emojis.length) {
    return {
      id,
      title: `Custom gradient`,
      description: gradient.description,
      tone: gradient.tone,
      style: { background: gradient.css },
    }
  }

  return {
    id,
    title: `Custom emoji (${emojis.join('')})`,
    description: `${listToProse(emojis)} emoji scattered over ${gradient.description}`,
    tone: gradient.tone,
    style: createEmojiBackground({
      emojis,
      base: gradient.css,
      // Seeding from the id keeps a given background rendering identically
      // between the editor preview and any later regeneration.
      seed: [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1,
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
