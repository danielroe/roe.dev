import { getSponsors } from '../utils/sponsors'

export default defineCachedEventHandler(
  async event => {
    if (import.meta.test) return []

    const sponsors = await getSponsors(event)
    return sponsors
      .map(s => s.avatarUrl?.replace(/(\?|%3Fu).*$/, ''))
      .filter((r): r is string => !!r)
  },
  { maxAge: 60 },
)
