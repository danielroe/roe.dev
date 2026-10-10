/**
 * Multipart endpoint: `payload` (JSON) + `video` (binary). The video is
 * uploaded straight to YouTube without persisting on the PDS.
 */
import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'

import { ensureNotAlreadyPublished, mergePublishedLink } from '../../../../../utils/admin/ama-record'
import { publishYouTubeShorts } from '../../../../../utils/admin/ama-youtube'
import type { AmaUpdate } from '../../../../../utils/admin/ama-record'
import type { AmaPostInput } from '../../../../../utils/admin/ama-resolve'

interface Payload extends AmaUpdate {
  answer: string
  posts: AmaPostInput[]
  force?: boolean
}

export default defineEventHandler(async event => {
  const rkey = getRouterParam(event, 'rkey')
  if (!rkey) throw createError({ status: 400, statusText: 'Missing rkey.' })

  const form = await event.req.formData()
  const payloadPart = form.get('payload')
  const videoPart = form.get('video')
  if (!payloadPart || !(videoPart instanceof Blob)) {
    throw createError({ status: 422, statusText: '`payload` (JSON) and `video` (binary) parts are required.' })
  }

  let body: Payload
  try {
    body = JSON.parse(typeof payloadPart === 'string' ? payloadPart : await payloadPart.text()) as Payload
  }
  catch (err) {
    throw createError({ status: 422, statusText: `Invalid payload JSON: ${err instanceof Error ? err.message : err}` })
  }
  if (!body.question || !body.answer || !body.posts?.length) {
    throw createError({ status: 422, statusText: 'question, answer, and at least one post are required.' })
  }

  await ensureNotAlreadyPublished(event, rkey, 'youtubeShorts', Boolean(body.force))

  const { url } = await publishYouTubeShorts({
    question: body.question,
    answer: body.answer,
    videoBuffer: new Uint8Array(await videoPart.arrayBuffer()),
    videoMimeType: videoPart.type || 'video/webm',
  })

  await mergePublishedLink(event, rkey, 'youtubeShorts', url, body)
  return { success: true, url }
})
