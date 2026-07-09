import { ensureNotAlreadyPublished, mergePublishedLink, prepareAmaImage } from '../../../../../utils/admin/ama-record'
import { buildEntityLookup, platformText } from '../../../../../utils/admin/ama-resolve'
import { publishMastodon } from '../../../../../utils/admin/ama-publish'
import type { AmaUpdate } from '../../../../../utils/admin/ama-record'
import type { AmaPostInput } from '../../../../../utils/admin/ama-resolve'

interface Body extends AmaUpdate {
  posts: AmaPostInput[]
  force?: boolean
}

export default defineEventHandler(async event => {
  const rkey = getRouterParam(event, 'rkey')
  if (!rkey) throw createError({ statusCode: 400, statusMessage: 'Missing rkey.' })

  const body = await readBody<Body>(event)
  if (!body.question || !body.posts?.length) {
    throw createError({ statusCode: 422, statusMessage: 'question and at least one post are required.' })
  }

  await ensureNotAlreadyPublished(event, rkey, 'mastodon', Boolean(body.force))
  const entities = await buildEntityLookup(event)
  const { url } = await publishMastodon(
    event,
    platformText(body.posts, 'mastodon', entities),
    await prepareAmaImage(event, rkey, body),
    body.question,
  )
  await mergePublishedLink(event, rkey, 'mastodon', url, body)
  return { success: true, url }
})
