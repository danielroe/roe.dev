// Regex to validate if a string contains exactly one emoji character (including complex emoji)
// including standard emoji, ZWJ sequences, country flags, and regional flags like Scotland (🏴󠁧󠁢󠁳󠁣󠁴󠁿)
const emojiRegex = /^(\p{ExtPict}|\p{Emoji}(\p{EMod})?|\p{Emoji}\uFE0F|\p{Emoji}\u20E3|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}]{2}|\p{Emoji}[\u{E0020}-\u{E007E}]+\u{E007F}|\p{Emoji}(\uFE0F)?(\u200D\p{Emoji}(\uFE0F)?)+)$/u

// Helper function to validate emoji
export function isValidEmoji (str: string): boolean {
  if (!str) return false
  return emojiRegex.test(str)
}
