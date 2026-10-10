import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'

import { ensureNotAlreadyPublished, mergePublishedLink, prepareAmaImage } from '../../../../../utils/admin/ama-record'
import { blueskyThread, buildEntityLookup } from '../../../../../utils/admin/ama-resolve'
import { publishBlueskyThread } from '../../../../../utils/admin/ama-publish'
import { getImageAltText } from '#shared/cms/backgrounds'
import type { AmaUpdate } from '../../../../../utils/admin/ama-record'
import type { AmaPostInput } from '../../../../../utils/admin/ama-resolve'

interface Body extends AmaUpdate {
  posts: AmaPostInput[]
  force?: boolean
}

export default defineEventHandler(async event => {
  const rkey = getRouterParam(event, 'rkey')
  if (!rkey) throw createError({ status: 400, statusText: 'Missing rkey.' })

  const body = await readBody<Body>(event)
  if (!body.question || !body.posts?.length) {
    throw createError({ status: 422, statusText: 'question and at least one post are required.' })
  }

  await ensureNotAlreadyPublished(event, rkey, 'bluesky', Boolean(body.force))

  const entities = await buildEntityLookup(event)
  const image = await prepareAmaImage(event, rkey, body)
  const { url } = await publishBlueskyThread(blueskyThread(body.posts, entities), image, getImageAltText(body.question, body.backgroundStyle ?? undefined))

  await mergePublishedLink(event, rkey, 'bluesky', url, body)
  return { success: true, url }
})
