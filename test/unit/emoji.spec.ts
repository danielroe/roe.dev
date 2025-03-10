import { describe, expect, it } from 'vitest'
import { isValidEmoji } from '../../shared/utils/emoji'

describe('emoji validation', () => {
  it('validates basic emoji correctly', () => {
    // Basic emoji should pass
    expect(isValidEmoji('😀')).toBe(true)
    expect(isValidEmoji('👍')).toBe(true)
    expect(isValidEmoji('❤️')).toBe(true)

    // Non-emoji should fail
    expect(isValidEmoji('abc')).toBe(false)
    expect(isValidEmoji('')).toBe(false)
    expect(isValidEmoji(' ')).toBe(false)
  })

  it('validates emoji with modifiers correctly', () => {
    // Emoji with skin tone modifiers
    expect(isValidEmoji('👍🏻')).toBe(true)
    expect(isValidEmoji('👍🏽')).toBe(true)
    expect(isValidEmoji('👍🏿')).toBe(true)
  })

  it('validates complex emoji correctly', () => {
    // ZWJ sequences (family, couples, etc.)
    expect(isValidEmoji('👨‍👩‍👧')).toBe(true)
    expect(isValidEmoji('👩‍💻')).toBe(true)

    // Flag emoji
    expect(isValidEmoji('🇺🇸')).toBe(true)
    expect(isValidEmoji('🇯🇵')).toBe(true)

    // Regional flags like Scotland flag
    expect(isValidEmoji('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toBe(true)
  })

  it('rejects multiple emoji', () => {
    // Multiple emoji should fail
    expect(isValidEmoji('😀😀')).toBe(false)
    expect(isValidEmoji('👍❤️')).toBe(false)
    expect(isValidEmoji('👨‍👩‍👧👨‍👩‍👧')).toBe(false)
  })

  it('rejects emoji with additional text', () => {
    expect(isValidEmoji('😀abc')).toBe(false)
    expect(isValidEmoji('abc😀')).toBe(false)
    expect(isValidEmoji(' 😀 ')).toBe(false)
  })
})
