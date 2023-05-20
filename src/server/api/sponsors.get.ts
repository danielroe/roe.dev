import { getSponsors } from '../utils/sponsors'

export default defineCachedEventHandler(
  async () => {
    const sponsors = await getSponsors()
    return sponsors.map(s => s.avatarUrl).filter((r): r is string => !!r)
  },
  { maxAge: 60 }
)
