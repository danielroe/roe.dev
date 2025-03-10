// Regex to validate if a string contains only emoji characters
// This is not perfect but catches most common emojis
// eslint-disable-next-line
const emojiRegex = /^(?:[\p{Emoji}\u200d\u{1f1e6}-\u{1f1ff}\u{1f3fb}-\u{1f3ff}\u{1f9b0}-\u{1f9b3}])/u

// Helper function to validate emoji
export function isValidEmoji (str: string): boolean {
  if (!str) return false
  return emojiRegex.test(str)
}
