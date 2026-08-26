import type { H3Event } from 'h3'

import { getRecord, putRecord } from '../atproto'
import { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

export interface Location {
  city: string
  region?: string
  countryCode: string
  meetupAvailable: boolean
}

export async function getCurrentLocation (event: H3Event): Promise<Location | null> {
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
