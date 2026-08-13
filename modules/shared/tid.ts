/** Fixed clock ID for deterministic TID generation from dates. */
const CLOCK_ID = 3
const MS_TO_MICROSECONDS = 1000

const S32_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz'

function s32 (value: number, length: number): string {
  let out = ''
  let n = value
  for (let i = 0; i < length; i++) {
    out = S32_ALPHABET[n % 32] + out
    n = Math.floor(n / 32)
  }
  return out
}

/**
 * Generate a deterministic TID from a date string.
 *
 * Uses the date's millisecond timestamp converted to microseconds,
 * combined with a fixed clock ID to ensure the same date always
 * produces the same TID.
 *
 * A TID is 13 base32-sortable characters: a leading zero bit, a 53-bit
 * microsecond timestamp, then a 10-bit clock ID. Encoding the timestamp and
 * the clock ID separately keeps every intermediate value inside the safe
 * integer range, which a single 64-bit shift would not.
 *
 * @see https://atproto.com/specs/tid
 */
export function tidFromDate (date: string | Date): string {
  const micros = (typeof date === 'string' ? new Date(date) : date).getTime() * MS_TO_MICROSECONDS
  return s32(micros, 11) + s32(CLOCK_ID, 2)
}

/** Stable TID for the site's publication record, derived from the first commit date. */
export const publicationRkey = tidFromDate('2019-12-10T20:18:52.000Z')
