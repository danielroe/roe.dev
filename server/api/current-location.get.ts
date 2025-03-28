import { groq } from '#imports'

const locationQuery = groq`
*[_type == 'location'] | order(_updatedAt desc)[0] {
  city,
  region,
  country,
  countryCode,
  meetupAvailable,
  _updatedAt
}
`

interface Location {
  city: string
  region?: string
  country: string
  countryCode: string
  meetupAvailable: boolean
  _updatedAt: string
}

const locationMaps: Record<string, string | undefined> = {
  'City of Edinburgh': 'Edinburgh',
  'United Kingdom': 'the UK',
  'United States': 'the US',
}

export default defineEventHandler(async event => {
  const sanity = useSanity(event)

  const location = await sanity.client.fetch<Location>(locationQuery)

  if (!location) {
    return null
  }

  // Convert country code to flag emoji
  const flagEmoji = location.region === 'Scotland'
    ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
    : location.countryCode
      ? String.fromCodePoint(...[...location.countryCode.toUpperCase()].map(char =>
          char.charCodeAt(0) + 127397))
      : '🌍'

  return {
    ...location,
    city: locationMaps[location.city] || location.city,
    country: location.region === 'Scotland' ? 'Scotland' : locationMaps[location.country] || location.country,
    flagEmoji,
  }
})
