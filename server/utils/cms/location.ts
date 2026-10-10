import type { RequestEvent } from 'nuxt/server'

import { invalidatePublicReads, requireAdminAirspace, useAirspace } from '../airspace'
import { collections } from '#shared/collections'

export interface Location {
  city: string
  region?: string
  countryCode: string
  meetupAvailable: boolean
}

export async function getCurrentLocation (): Promise<Location | null> {
  const record = await useAirspace().location.get()
  if (!record) return null
  const v = record.value
  return {
    city: v.address.locality ?? '',
    region: v.address.region,
    countryCode: v.address.country.toUpperCase(),
    meetupAvailable: v.meetupAvailable ?? false,
  }
}

export async function setCurrentLocation (event: RequestEvent, loc: Location): Promise<void> {
  const airspace = await requireAdminAirspace(event)
  await airspace.location.put({
    address: {
      $type: 'community.lexicon.location.address',
      country: loc.countryCode.toUpperCase(),
      ...(loc.region ? { region: loc.region } : {}),
      locality: loc.city,
    },
    meetupAvailable: loc.meetupAvailable,
  })
  invalidatePublicReads(collections.location.nsid)
}
