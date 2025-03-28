import { groq } from '#imports'

export default defineEventHandler(async event => {
  const { latitude, longitude, meetupAvailable, apiKey } = await readBody(event)

  if (!latitude || !longitude || !apiKey) {
    return createError({
      statusCode: 400,
      statusMessage: 'Missing required fields. Need latitude, longitude, and apiKey.',
    })
  }

  const config = useRuntimeConfig()
  if (apiKey !== config.locationApiKey) {
    return createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const response = await $fetch<OpenCageResponse>(`https://api.opencagedata.com/geocode/v1/json`, {
    params: {
      q: `${latitude},${longitude}`,
      key: config.openCageApiKey,
      no_annotations: 1,
      language: 'en',
    },
  })

  if (!response.results || response.results.length === 0) {
    return createError({
      statusCode: 400,
      statusMessage: 'Could not geocode the provided coordinates',
    })
  }

  const location = response.results[0]
  const components = location.components

  // Extract relevant information
  const locationData = {
    city: components.city || components.town || components.village || components.hamlet || 'Unknown',
    region: components.state || components.province || components.county || '',
    country: components.country || 'Unknown',
    countryCode: components.country_code ? components.country_code.toUpperCase() : 'XX',
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

type OpenCageResponse = {
  results: Array<{
    components: {
      city?: string
      town?: string
      village?: string
      hamlet?: string
      state?: string
      province?: string
      county?: string
      country?: string
      country_code?: string
    }
    geometry: {
      lat: number
      lng: number
    }
  }>
  status: { code: number, message: string }
  total_results: number
}
