import { setCurrentLocation } from '../utils/cms/location'

export default defineEventHandler(async event => {
  const { latitude, longitude, meetupAvailable, apiKey } = await readBody(event)

  if (!latitude || !longitude || !apiKey) {
    return createError({
      statusCode: 400,
      statusMessage: 'Missing required fields. Need latitude, longitude, and apiKey.',
    })
  }

  const config = useRuntimeConfig(event)
  if (apiKey !== config.locationApiKey) {
    return createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const response = await $fetch<BigDataResponse>(`https://api.bigdatacloud.net/data/reverse-geocode-client`, {
    params: {
      latitude,
      longitude,
      localityLanguage: 'en',
    },
  })

  if (!response || !response.city) {
    return createError({
      statusCode: 400,
      statusMessage: 'Could not geocode the provided coordinates',
    })
  }

  const locationData = {
    city: response.city || response.locality || 'Unknown',
    region: response.principalSubdivision || response.localityInfo?.administrative?.[1]?.name || '',
    country: response.countryName || 'Unknown',
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
  countryName: string
  countryCode: string
  localityInfo?: {
    administrative?: Array<{
      name: string
      level: number
    }>
  }
}
