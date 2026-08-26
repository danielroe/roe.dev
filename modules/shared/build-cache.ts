/**
 * Tiny on-disk cache for build-time work (markdown highlighting, atproto
 * identity resolution, Bluesky post discovery). Everything lives under
 * `node_modules/.cache/roe.dev/<namespace>` so it is disposable: a miss only
 * ever costs the work it was caching.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'

import { join } from 'pathe'
import { useNuxt } from 'nuxt/kit'

export function hashKey (...parts: Array<string | number | undefined>): string {
  return createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 16)
}

export function createBuildCache (namespace: string) {
  const dir = join(useNuxt().options.rootDir, 'node_modules', '.cache', 'roe.dev', namespace)
  let ready: Promise<unknown> | undefined

  function ensureDir () {
    return (ready ||= mkdir(dir, { recursive: true }))
  }

  return {
    async get<T> (key: string): Promise<{ value: T, mtime: number } | null> {
      try {
        const raw = await readFile(join(dir, `${key}.json`), 'utf8')
        return JSON.parse(raw) as { value: T, mtime: number }
      }
      catch {
        return null
      }
    },
    async set<T> (key: string, value: T): Promise<void> {
      try {
        await ensureDir()
        const file = join(dir, `${key}.json`)
        const tmp = `${file}.${process.pid}.tmp`
        await writeFile(tmp, JSON.stringify({ value, mtime: Date.now() }))
        await rename(tmp, file)
      }
      catch {
        // a cache that cannot be written is still a working cache
      }
    },
  }
}

/**
 * Read `key` from `namespace`, falling back to `fetch`. Entries older than
 * `maxAge` are returned anyway when `stale` is set, with a refresh kicked off
 * in the background so the next build gets a fresh value without this one
 * paying for it.
 */
export async function withCache<T> (options: {
  namespace: string
  key: string
  maxAge: number
  stale?: boolean
  fetch: () => Promise<T>
}): Promise<T | null> {
  const cache = createBuildCache(options.namespace)
  const entry = await cache.get<T>(options.key)

  if (entry && Date.now() - entry.mtime < options.maxAge) {
    return entry.value
  }

  if (entry && options.stale) {
    options.fetch().then(value => cache.set(options.key, value)).catch(() => {})
    return entry.value
  }

  const value = await options.fetch()
  await cache.set(options.key, value)
  return value
}
