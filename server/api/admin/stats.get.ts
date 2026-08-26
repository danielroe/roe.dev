import type { Client, RecordSchema } from '@atproto/lex'

import { requireAdminClient } from '../../utils/admin/client'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const { client, did } = await requireAdminClient(event)

  const count = async (schema: RecordSchema): Promise<number> => {
    let total = 0
    for await (const _ of (client as Client).listAll(schema, { repo: did, limit: 100 })) total++
    return total
  }

  const [talks, talkGroups, usesCategories, usesItems, projectCategories, projects] = await Promise.all([
    count(dev.roe.talk.main),
    count(dev.roe.talkGroup.main),
    count(dev.roe.usesCategory.main),
    count(dev.roe.usesItem.main),
    count(dev.roe.projectCategory.main),
    count(dev.roe.project.main),
  ])

  // Location is a singleton; check by attempting to fetch `self`.
  let hasLocation = false
  try {
    await client.getRecord('dev.roe.location', 'self', { repo: did })
    hasLocation = true
  }
  catch { /* missing record → false */ }

  return { talks, talkGroups, usesCategories, usesItems, projectCategories, projects, hasLocation }
})
