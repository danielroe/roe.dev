import { TID } from '@atproto/common-web'

/** Fixed clock ID for deterministic TID generation from dates. */
const CLOCK_ID = 3
const MS_TO_MICROSECONDS = 1000

/**
 * Generate a deterministic TID from a date string.
 *
 * Uses the date's millisecond timestamp converted to microseconds,
 * combined with a fixed clock ID to ensure the same date always
 * produces the same TID.
 *
 * @see https://atproto.com/specs/tid
 */
export function tidFromDate (date: string | Date): string {
  const timestamp = (typeof date === 'string' ? new Date(date) : date).getTime() * MS_TO_MICROSECONDS
  return TID.fromTime(timestamp, CLOCK_ID).toString()
}

/** Stable TID for the site's publication record, derived from the first commit date. */
export const publicationRkey = tidFromDate('2019-12-10T20:18:52.000Z')
