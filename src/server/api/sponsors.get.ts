import { getSponsors } from '../utils/sponsors'

export default defineCachedEventHandler(
  async () => {
    if (import.meta.test) return []

    const sponsors = await getSponsors()
    return sponsors
      .map(s => s.avatarUrl?.replace(/(\?|%3Fu).*$/, ''))
      .filter((r): r is string => !!r)
  },
  { maxAge: 60 }
)
