import { getSponsors } from '../utils/sponsors'

export default defineEventHandler(
  async (): Promise<string[]> => {
    if (import.meta.test) return []

    const sponsors = await getSponsors()
    return sponsors
      .map(s => s.avatarUrl?.replace(/(\?|%3Fu).*$/, ''))
      .filter((r): r is string => !!r)
  },
)
