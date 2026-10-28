import process from 'node:process'

/**
 * Persistence and pub/sub shared by every server instance. Values are
 * JSON-encoded.
 */
export interface PartyStore {
  get<T> (key: string): Promise<T | null>
  set (key: string, value: unknown): Promise<void>
  del (...keys: string[]): Promise<void>
  incr (key: string): Promise<number>
  /** Appends `value` to a list and resolves with the whole list. */
  append<T> (key: string, value: T): Promise<T[]>
  list<T> (key: string): Promise<T[]>
  hget<T> (key: string, field: string): Promise<T | null>
  hmget<T> (key: string, fields: string[]): Promise<Array<T | null>>
  hgetall<T> (key: string): Promise<Record<string, T>>
  hset (key: string, entries: Record<string, unknown>): Promise<void>
  /** Marks `members` of a set as seen at `at`, resolving with how many were not already in it. */
  touch (key: string, members: string[], at: number): Promise<number>
  /** Resolves with the members that were in the set. */
  untouch (key: string, members: string[]): Promise<string[]>
  /** Removes and resolves with members last seen before `before`. */
  prune (key: string, before: number): Promise<string[]>
  members (key: string): Promise<string[]>
  publish (channel: string, message: string): Promise<void>
  /** Returns a function that ends the subscription. */
  subscribe (channel: string, onMessage: (message: string) => void): () => void
}

export async function createRedisStore (url: string, token: string): Promise<PartyStore> {
  const { Redis } = await import('@upstash/redis')
  const redis = new Redis({ url, token, automaticDeserialization: false })
  const parse = <T>(value: string | null | undefined) => (value == null ? null : JSON.parse(value) as T)
  const store: PartyStore = {
    get: async key => parse(await redis.get<string>(key)),
    set: async (key, value) => {
      await redis.set(key, JSON.stringify(value))
    },
    del: async (...keys) => {
      if (keys.length) await redis.del(...keys)
    },
    incr: key => redis.incr(key),
    append: async (key, value) => {
      const [, list] = await redis.multi()
        .rpush(key, JSON.stringify(value))
        .lrange<string>(key, 0, -1)
        .exec<[number, string[]]>()
      return list.map(v => JSON.parse(v))
    },
    list: async key => (await redis.lrange<string>(key, 0, -1)).map(v => JSON.parse(v)),
    hget: async (key, field) => parse(await redis.hget<string>(key, field)),
    hmget: async (key, fields) => {
      if (!fields.length) return []
      // without automatic deserialisation, the raw reply is an array in field order
      const values = await redis.hmget(key, ...fields) as unknown as Array<string | null> | null
      return fields.map((_, i) => parse(values?.[i]))
    },
    hgetall: async key => {
      // without automatic deserialisation, the raw reply alternates fields and values
      const values = await redis.hgetall(key) as unknown as string[] | null ?? []
      const entries: Record<string, any> = {}
      for (let i = 0; i < values.length; i += 2) entries[values[i]!] = JSON.parse(values[i + 1]!)
      return entries
    },
    hset: async (key, entries) => {
      if (!Object.keys(entries).length) return
      await redis.hset(key, Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)])))
    },
    touch: async (key, members, at) => {
      const [first, ...rest] = members.map(member => ({ score: at, member }))
      if (!first) return 0
      return await redis.zadd(key, first, ...rest) ?? 0
    },
    untouch: async (key, members) => {
      if (!members.length) return []
      const pipeline = redis.pipeline()
      for (const member of members) pipeline.zrem(key, member)
      const removed = await pipeline.exec<number[]>()
      return members.filter((_, i) => removed[i])
    },
    prune: async (key, before) => {
      const stale = await redis.zrange<string[]>(key, '-inf', before, { byScore: true })
      return store.untouch(key, stale)
    },
    members: key => redis.zrange<string[]>(key, 0, -1),
    publish: async (channel, message) => {
      await redis.publish(channel, message)
    },
    subscribe: (channel, onMessage) => {
      const controller = new AbortController()
      const prefix = `data: message,${channel},`
      const listen = async () => {
        const res = await fetch(`${url.replace(/\/$/, '')}/subscribe/${channel}`, {
          method: 'POST',
          headers: { 'authorization': `Bearer ${token}`, 'accept': 'text/event-stream', 'content-type': 'application/json' },
          body: '[]',
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error(`Subscribing to ${channel} failed with ${res.status}`)
        let buffer = ''
        for await (const chunk of res.body.pipeThrough(new TextDecoderStream())) {
          buffer += chunk
          const lines = buffer.split('\n')
          buffer = lines.pop()!
          for (const line of lines) {
            if (line.startsWith(prefix)) onMessage(line.slice(prefix.length))
          }
        }
      }
      ;(async () => {
        let delay = 250
        while (!controller.signal.aborted) {
          const started = Date.now()
          await listen().catch(err => {
            if (!controller.signal.aborted) console.error(err)
          })
          if (controller.signal.aborted) return
          delay = Date.now() - started > 10_000 ? 250 : Math.min(delay * 2, 10_000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      })()
      return () => controller.abort()
    },
  }
  return store
}

/** A single-process store, for development and tests. */
export function createMemoryStore (): PartyStore {
  const values = new Map<string, string>()
  const lists = new Map<string, string[]>()
  const hashes = new Map<string, Map<string, string>>()
  const sets = new Map<string, Map<string, number>>()
  const channels = new Map<string, Set<(message: string) => void>>()

  const parse = <T>(value: string | undefined) => (value === undefined ? null : JSON.parse(value) as T)
  const hash = (key: string) => hashes.get(key) ?? hashes.set(key, new Map()).get(key)!
  const set = (key: string) => sets.get(key) ?? sets.set(key, new Map()).get(key)!

  return {
    get: async key => parse(values.get(key)),
    set: async (key, value) => {
      values.set(key, JSON.stringify(value))
    },
    del: async (...keys) => {
      for (const key of keys) {
        values.delete(key)
        lists.delete(key)
        hashes.delete(key)
        sets.delete(key)
      }
    },
    incr: async key => {
      const value = (parse<number>(values.get(key)) ?? 0) + 1
      values.set(key, JSON.stringify(value))
      return value
    },
    append: async (key, value) => {
      const list = lists.get(key) ?? lists.set(key, []).get(key)!
      list.push(JSON.stringify(value))
      return list.map(v => JSON.parse(v))
    },
    list: async key => (lists.get(key) ?? []).map(v => JSON.parse(v)),
    hget: async (key, field) => parse(hashes.get(key)?.get(field)),
    hmget: async (key, fields) => fields.map(f => parse(hashes.get(key)?.get(f))),
    hgetall: async key => Object.fromEntries([...hashes.get(key) ?? []].map(([k, v]) => [k, JSON.parse(v)])),
    hset: async (key, entries) => {
      for (const [k, v] of Object.entries(entries)) hash(key).set(k, JSON.stringify(v))
    },
    touch: async (key, members, at) => {
      let added = 0
      for (const member of members) {
        if (!set(key).has(member)) added++
        set(key).set(member, at)
      }
      return added
    },
    untouch: async (key, members) => members.filter(m => sets.get(key)?.delete(m)),
    prune: async (key, before) => {
      const stale = [...sets.get(key) ?? []].filter(([, at]) => at <= before).map(([m]) => m)
      for (const member of stale) sets.get(key)!.delete(member)
      return stale
    },
    members: async key => [...sets.get(key)?.keys() ?? []],
    publish: async (channel, message) => {
      for (const listener of channels.get(channel) ?? []) queueMicrotask(() => listener(message))
    },
    subscribe: (channel, onMessage) => {
      const listeners = channels.get(channel) ?? channels.set(channel, new Set()).get(channel)!
      listeners.add(onMessage)
      return () => listeners.delete(onMessage)
    },
  }
}

let store: Promise<PartyStore> | undefined

export function usePartyStore () {
  if (store) return store
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (url && token) return store = createRedisStore(url, token)
  if (!import.meta.dev) console.warn('[party] No Upstash credentials found; falling back to a single-instance memory store.')
  return store = Promise.resolve(createMemoryStore())
}
