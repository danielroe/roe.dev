/**
 * Multipart endpoint: `payload` (JSON) + `video` (binary). The video is
 * uploaded straight to YouTube without persisting on the PDS.
 */
import { readMultipartFormData } from 'nitro/h3'

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
  if (!rkey) throw createError({ status: 400, message: 'Missing rkey.' })

  const parts = await readMultipartFormData(event)
  const payloadPart = parts?.find(p => p.name === 'payload')
  const videoPart = parts?.find(p => p.name === 'video')
  if (!payloadPart || !videoPart) {
    throw createError({ status: 422, message: '`payload` (JSON) and `video` (binary) parts are required.' })
  }

  let body: Payload
  try {
    body = JSON.parse(new TextDecoder().decode(payloadPart.data)) as Payload
  }
  catch (err) {
    throw createError({ status: 422, message: `Invalid payload JSON: ${err instanceof Error ? err.message : err}` })
  }
  if (!body.question || !body.answer || !body.posts?.length) {
    throw createError({ status: 422, message: 'question, answer, and at least one post are required.' })
  }

  await ensureNotAlreadyPublished(event, rkey, 'youtubeShorts', Boolean(body.force))

  // Use the explicit slice form so we ship only the multipart-parsed video
  // bytes, not the surrounding bytes of Node's shared Buffer pool.
  const { url } = await publishYouTubeShorts(event, {
    question: body.question,
    answer: body.answer,
    videoBuffer: new Uint8Array(videoPart.data.buffer, videoPart.data.byteOffset, videoPart.data.byteLength),
    videoMimeType: videoPart.type || 'video/webm',
  })

  await mergePublishedLink(event, rkey, 'youtubeShorts', url, body)
  return { success: true, url }
})
