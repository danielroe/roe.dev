import type { H3Event } from 'nitro/h3'

/**
 * `readBody` resolves to `undefined` when a request has no body. Handlers that
 * cannot do anything useful without one should reject the request instead.
 */
export async function requireBody<T> (event: H3Event): Promise<T> {
  const body = await requireBody<T>(event)
  if (body === undefined) {
    throw createError({ status: 400, message: 'Request body is required.' })
  }
  return body
}
