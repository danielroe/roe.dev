import { requireAdminAgent } from '../../utils/admin/agent'

/**
 * Upload bytes to the PDS and return `{ blob, aspectRatio? }`. The server
 * probe is a fallback for callers that don't supply their own dimensions;
 * a caller that has already measured the image should prefer its own
 * value.
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

  const { agent } = await requireAdminAgent(event)
  const [res, aspectRatio] = await Promise.all([
    agent.com.atproto.repo.uploadBlob(bytes, { encoding: contentType }),
    probeAspectRatio(bytes, contentType),
  ])
  return {
    blob: res.data.blob,
    ...(aspectRatio ? { aspectRatio } : {}),
  }
})

async function probeAspectRatio (bytes: Uint8Array, contentType: string): Promise<{ width: number, height: number } | null> {
  if (!contentType.startsWith('image/')) return null
  try {
    const { imageMeta } = await import('image-meta')
    const { width, height } = imageMeta(bytes)
    if (!width || !height) return null
    return { width, height }
  }
  catch {
    return null
  }
}
