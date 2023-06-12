import { getSponsors } from '../utils/sponsors'

export default defineCachedEventHandler(
  async () => {
    const sponsors = await getSponsors()
    return sponsors
      .map(s => s.avatarUrl?.replace(/(\?|%3Fu).*$/, ''))
      .filter((r): r is string => !!r)
  },
  { maxAge: 60 }
)
