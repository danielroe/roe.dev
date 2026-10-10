import { createError, defineEventHandler, readBody, useRuntimeConfig } from 'nuxt/server'
import { $fetch } from 'ofetch'

import { setCurrentLocation } from '../utils/cms/location'

export default defineEventHandler(async event => {
  const { latitude, longitude, meetupAvailable, apiKey } = await readBody<{
    latitude?: number
    longitude?: number
    meetupAvailable?: boolean
    apiKey?: string
  }>(event)

  if (!latitude || !longitude || !apiKey) {
    return createError({
      status: 400,
      statusText: 'Missing required fields. Need latitude, longitude, and apiKey.',
    })
  }

  const config = useRuntimeConfig()
  if (apiKey !== config.locationApiKey) {
    return createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  const response = await $fetch<BigDataResponse>('https://api.bigdatacloud.net/data/reverse-geocode-client', {
    query: {
      latitude,
      longitude,
      localityLanguage: 'en',
    },
  })

  if (!response || !response.city) {
    return createError({
      status: 400,
      statusText: 'Could not geocode the provided coordinates',
    })
  }

  const locationData = {
    city: response.city || response.locality || 'Unknown',
    region: response.principalSubdivision || response.localityInfo?.administrative?.[1]?.name || '',
    countryCode: response.countryCode || 'XX',
    meetupAvailable: meetupAvailable !== undefined ? meetupAvailable : true,
  }

  await setCurrentLocation(event, locationData)

  try {
    const emoji = locationData.city.includes('Edinburgh')
      ? '🏠'
      : locationData.region === 'Scotland'
        ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
        : locationData.countryCode
          ? String.fromCodePoint(...[...locationData.countryCode.toUpperCase()].map(char => char.charCodeAt(0) + 127397))
          : '🌍'

    await query(config.github.profileToken, `
      mutation {
        changeUserStatus(input: { emoji: "${emoji}" }) {
          status { emoji }
        }
      }
    `)
  }
  catch (error) {
    console.error('Failed to update GitHub status:', error)
  }

  return null
})

type BigDataResponse = {
  city: string
  locality?: string
  principalSubdivision?: string
  countryCode: string
  localityInfo?: {
    administrative?: Array<{
      name: string
      level: number
    }>
  }
}
