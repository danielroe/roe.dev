import type { H3Event } from 'h3'

import { getRecord, putRecord } from '../atproto'
import { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

export interface Location {
  city: string
  region?: string
  country: string
  countryCode: string
  meetupAvailable: boolean
}

export async function getCurrentLocation (event: H3Event): Promise<Location | null> {
  const rec = await getRecord(event, dev.roe.location.main, 'self')
  if (!rec) return null
  const v = rec.value
  return {
    city: v.city,
    region: v.region,
    country: v.country,
    countryCode: v.countryCode,
    meetupAvailable: v.meetupAvailable ?? false,
  }
}

export async function setCurrentLocation (event: H3Event, loc: Location): Promise<void> {
  const value: Loose<Omit<dev.roe.location.Main, '$type'>> = {
    city: loc.city,
    ...(loc.region ? { region: loc.region } : {}),
    country: loc.country,
    countryCode: loc.countryCode.toUpperCase(),
    meetupAvailable: loc.meetupAvailable,
    createdAt: new Date().toISOString(),
  }
  await putRecord(event, dev.roe.location.main, 'self', value)
}
