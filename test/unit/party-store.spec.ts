import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRedisStore } from '../../server/utils/party/store'

function stubUpstash (replies: Record<string, unknown>) {
  const reply = ([command]: string[]) => ({ result: replies[command!.toLowerCase()] })
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string)
    return Response.json(url.endsWith('/pipeline') ? body.map(reply) : reply(body))
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('redis party store', () => {
  it('decodes raw hash replies', async () => {
    stubUpstash({
      hgetall: ['a', '{"id":"a"}', 'b', '{"id":"b"}'],
      hmget: ['{"id":"b"}', null, '{"id":"a"}'],
    })
    const store = await createRedisStore('https://example.upstash.io', 'token')

    expect(await store.hgetall('cursors')).toEqual({ a: { id: 'a' }, b: { id: 'b' } })
    expect(await store.hmget('cursors', ['b', 'missing', 'a'])).toEqual([{ id: 'b' }, null, { id: 'a' }])
  })

  it('keeps list values as strings', async () => {
    stubUpstash({ lrange: ['"123"', '"true"', '"a, b"'] })
    const store = await createRedisStore('https://example.upstash.io', 'token')

    expect(await store.list('feedback')).toEqual(['123', 'true', 'a, b'])
  })
})
