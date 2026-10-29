// Regex to validate if a string contains exactly one emoji character (including complex emoji)
// including standard emoji, ZWJ sequences, country flags, and regional flags like Scotland (🏴󠁧󠁢󠁳󠁣󠁴󠁿)
const emojiRegex = /^(\p{ExtPict}|\p{Emoji}(\p{EMod})?|\p{Emoji}\uFE0F|\p{Emoji}\u20E3|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}]{2}|\p{Emoji}[\u{E0020}-\u{E007E}]+\u{E007F}|\p{Emoji}(\uFE0F)?(\u200D\p{Emoji}(\uFE0F)?)+)$/u

// Helper function to validate emoji
export function isValidEmoji (str: string): boolean {
  if (!str) return false
  return emojiRegex.test(str)
}

const graphemeSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : undefined
const pictographicRe = /^\p{Extended_Pictographic}/u
const flagRe = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u

/** Splits a string into user-perceived characters (grapheme clusters). */
export function splitGraphemes (str: string): string[] {
  if (!graphemeSegmenter) return Array.from(str)
  return Array.from(graphemeSegmenter.segment(str), s => s.segment)
}

/** Whether `str` is exactly one emoji: a pictographic grapheme or a regional-indicator flag. */
export function isSingleEmoji (str: unknown): str is string {
  if (typeof str !== 'string' || !str || str.length > 16) return false
  if (splitGraphemes(str).length !== 1) return false
  return pictographicRe.test(str) || flagRe.test(str)
}
