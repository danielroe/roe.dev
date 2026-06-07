import { getCurrentLocation } from '../utils/cms/location'

export default defineEventHandler(async event => {
  const location = await getCurrentLocation(event)
  if (!location) return null

  const flagEmoji = location.region === 'Scotland'
    ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
    : location.countryCode
      ? String.fromCodePoint(...[...location.countryCode.toUpperCase()].map(char =>
          char.charCodeAt(0) + 127397))
      : '🌍'

  // Some geocoders return verbose ISO 3166 country names (e.g. "United
  // Kingdom of Great Britain and Northern Ireland (the)"); prefer the
  // sub-region for those countries when we have one.
  const locationMaps: Record<string, string | undefined> = {
    'United Kingdom of Great Britain and Northern Ireland (the)': location.region,
    'United States of America (the)': location.region,
  }

  return {
    meetupAvailable: location.meetupAvailable,
    city: locationMaps[location.city] || location.city,
    area: location.region === 'Scotland' ? 'Scotland' : locationMaps[location.country] || location.country,
    flagEmoji,
  }
})
