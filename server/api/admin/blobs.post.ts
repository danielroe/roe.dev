import { createError, defineEventHandler, getRequestHeader } from 'nuxt/server'

import { requireAdminAirspace } from '../../utils/airspace'

/**
 * Upload bytes to the PDS and return `{ blob, aspectRatio? }`. Dimensions come
 * from the image header, so a caller that has already measured the image does
 * not have to send them.
 */
export default defineEventHandler(async event => {
  const contentType = getRequestHeader(event, 'content-type') || 'application/octet-stream'
  const bytes = new Uint8Array(await event.req.arrayBuffer())
  if (!bytes.length) {
    throw createError({ status: 400, statusText: 'Empty body.' })
  }

  const airspace = await requireAdminAirspace(event)
  const { blob, aspectRatio } = await airspace.blobs.upload(bytes, { mimeType: contentType })
  return { blob, ...(aspectRatio ? { aspectRatio } : {}) }
})
