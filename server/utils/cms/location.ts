import type { H3Event } from 'h3'

import { LexValidationError } from '@atproto/lex'

import { getRawRecord, getRecord, putRecord } from '../atproto'
import { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

export interface Location {
  city: string
  region?: string
  countryCode: string
  meetupAvailable: boolean
}

export async function getCurrentLocation (event: H3Event): Promise<Location | null> {
  try {
    const rec = await getRecord(event, dev.roe.location.main, 'self')
    if (!rec) return null
    const v = rec.value
    return {
      city: v.address.locality ?? '',
      region: v.address.region,
      countryCode: v.address.country.toUpperCase(),
      meetupAvailable: v.meetupAvailable ?? false,
    }
  }
  catch (err) {
    if (!(err instanceof LexValidationError)) throw err
    return legacyLocation(event)
  }
}

export async function setCurrentLocation (event: H3Event, loc: Location): Promise<void> {
  const value: Loose<Omit<dev.roe.location.Main, '$type'>> = {
    address: {
      $type: 'community.lexicon.location.address',
      country: loc.countryCode.toUpperCase(),
      ...(loc.region ? { region: loc.region } : {}),
      locality: loc.city,
    },
    meetupAvailable: loc.meetupAvailable,
    createdAt: new Date().toISOString(),
  }
  await putRecord(event, dev.roe.location.main, 'self', value)
}

/**
 * City, region and country used to be flat fields on the record; they now live
 * in a `community.lexicon.location.address`, which the schema requires. A record
 * written before the switch therefore fails validation on read, so fall back to
 * an unvalidated read until the next location update rewrites it.
 */
async function legacyLocation (event: H3Event): Promise<Location | null> {
  const value = await getRawRecord(event, 'dev.roe.location', 'self')
  if (!value) return null
  const legacy = value as { city?: string, region?: string, countryCode?: string, meetupAvailable?: boolean }
  return {
    city: legacy.city ?? '',
    region: legacy.region,
    countryCode: (legacy.countryCode ?? '').toUpperCase(),
    meetupAvailable: legacy.meetupAvailable ?? false,
  }
}
