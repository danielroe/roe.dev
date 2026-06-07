import { requireAdminAgent } from '../../utils/admin/agent'

export default defineEventHandler(async event => {
  const { agent, did } = await requireAdminAgent(event)

  const count = async (collection: string): Promise<number> => {
    // Cheapest path: list with limit=1 and rely on cursor to know whether
    // more exist. For accurate counts (small collections) we paginate.
    let total = 0
    let cursor: string | undefined
    while (true) {
      const res = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection,
        limit: 100,
        cursor,
      })
      total += res.data.records.length
      if (!res.data.cursor || res.data.records.length < 100) break
      cursor = res.data.cursor
    }
    return total
  }

  const [talks, talkGroups, usesCategories, usesItems] = await Promise.all([
    count('dev.roe.talk'),
    count('dev.roe.talkGroup'),
    count('dev.roe.usesCategory'),
    count('dev.roe.usesItem'),
  ])

  // Location is a singleton; check by attempting to fetch `self`.
  let hasLocation = false
  try {
    await agent.com.atproto.repo.getRecord({ repo: did, collection: 'dev.roe.location', rkey: 'self' })
    hasLocation = true
  }
  catch { /* missing record → false */ }

  return { talks, talkGroups, usesCategories, usesItems, hasLocation }
})
