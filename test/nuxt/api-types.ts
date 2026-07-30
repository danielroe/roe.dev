/**
 * Compile-time assertions for the typed API client, checked by `pnpm test:types`
 */
import type { InternalApi } from 'nitro/types'

import type { CurrentLocation, SessionUser, Stream, Talk } from '#shared/types/api'
import type { PublicApi } from '#shared/types/api/schema'

type Expect<T extends true> = T
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

export async function positive () {
  const loc = await apiFetch('/api/current-location')
  type _1 = Expect<Equal<typeof loc, CurrentLocation | null>>
  const streams = await apiFetch('/api/streams')
  type _2 = Expect<Equal<typeof streams, Stream[]>>
  const user = await apiFetch('/api/user')
  type _3 = Expect<Equal<typeof user, SessionUser>>
  const q = await apiFetch('/api/question', { method: 'POST', body: { question: 'hi' } })
  type _4 = Expect<Equal<typeof q, null>>
  const { data: talks } = useApiFetch('/api/talks')
  type _5 = Expect<Equal<typeof talks.value, Talk[] | undefined>>
  const { data: count } = useApiFetch('/api/streams', { transform: s => s.length })
  type _6 = Expect<Equal<typeof count.value, number | undefined>>
  const { data: sponsors } = useApiFetch('/api/sponsors', { default: () => [] as string[] })
  type _7 = Expect<Equal<typeof sponsors.value, string[]>>
  return { loc, streams, user, q, talks, count, sponsors }
}

export async function negative () {
  // @ts-expect-error unknown path
  await apiFetch('/api/nope')
  // @ts-expect-error `/api/question` is POST-only, so `method` is required
  await apiFetch('/api/question')
  // @ts-expect-error body does not match the schema
  await apiFetch('/api/feedback', { method: 'POST', body: { wrong: 1 } })
  // @ts-expect-error `/api/streams` has no POST handler
  await apiFetch('/api/streams', { method: 'POST', body: {} })
  // @ts-expect-error POST-only paths are not valid for useApiFetch
  useApiFetch('/api/question')
}

/**
 * Every path the schema declares must still be a real route, so renaming or
 * deleting a handler cannot leave a stale entry behind.
 */
type _SchemaPathsExist = Expect<Equal<Exclude<keyof PublicApi, keyof InternalApi>, never>>
