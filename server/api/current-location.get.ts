import { getCurrentLocation } from '../utils/cms/location'

const regionalFlags: Record<string, string> = {
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
}

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

export default defineEventHandler(async event => {
  const location = await getCurrentLocation(event)
  if (!location) return null

  const countryCode = location.countryCode.toUpperCase()

  const flagEmoji = (location.region && regionalFlags[location.region])
    || (countryCode
      ? String.fromCodePoint(...[...countryCode].map(char => char.charCodeAt(0) + 127397))
      : '🌍')

  // The UK and the US are big enough that the subdivision is the more useful
  // label; elsewhere the country reads better.
  const area = (['GB', 'US'].includes(countryCode) && location.region)
    || (countryCode ? countryNames.of(countryCode) : undefined)

  return {
    meetupAvailable: location.meetupAvailable,
    city: location.city,
    area: area ?? '',
    flagEmoji,
  }
})
