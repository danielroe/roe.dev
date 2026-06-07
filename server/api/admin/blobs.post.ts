import { requireAdminAgent } from '../../utils/admin/agent'

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
  const res = await agent.com.atproto.repo.uploadBlob(bytes, { encoding: contentType })
  return res.data.blob
})
