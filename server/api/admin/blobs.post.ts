import { requireAdminAirspace } from '../../utils/airspace'

/**
 * Upload bytes to the PDS and return `{ blob, aspectRatio? }`. Dimensions come
 * from the image header, so a caller that has already measured the image does
 * not have to send them.
 */
export default defineEventHandler(async event => {
  const contentType = getRequestHeader(event, 'content-type') || 'application/octet-stream'
  const buf = await readRawBody(event, false)
  if (!buf || !buf.length) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body.' })
  }

  // Slice exactly what we read out of Node's shared Buffer pool, otherwise
  // `new Uint8Array(buf)` views the entire pooled ArrayBuffer (including
  // bytes from neighbouring allocations) and we'd upload that.
  const bytes = buf instanceof Uint8Array
    ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    : new Uint8Array(buf)

  const airspace = await requireAdminAirspace(event)
  const { blob, aspectRatio } = await airspace.blobs.upload(bytes, { mimeType: contentType })
  return { blob, ...(aspectRatio ? { aspectRatio } : {}) }
})
