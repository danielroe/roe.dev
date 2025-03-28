import { groq } from '#imports'

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

  // Extract relevant information
  const locationData = {
    city: response.city || response.locality || 'Unknown',
    region: response.principalSubdivision || response.localityInfo?.administrative?.[1]?.name || '',
    country: response.countryName || 'Unknown',
    countryCode: response.countryCode || 'XX',
    latitude,
    longitude,
    meetupAvailable: meetupAvailable !== undefined ? meetupAvailable : true,
    updatedAt: new Date().toISOString(),
  }

  // Initialize Sanity client
  const sanity = useSanity(event)

  // Check if a location document exists
  const existingLocation = await sanity.client.fetch(
    groq`*[_type == "location"] | order(_updatedAt desc)[0]._id`,
  )

  if (existingLocation) {
    // Update existing document
    await sanity.client.patch(existingLocation).set(locationData).commit()
  }
  else {
    // Create new document
    await sanity.client.create({ _type: 'location', ...locationData })
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
