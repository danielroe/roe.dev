/**
 * Build-time atproto reader. Used by Nuxt modules (`modules/slides.ts`,
 * `modules/sync/index.ts`) that run before the Nitro runtime exists and so
 * can't use `server/utils/atproto.ts`.
 *
 * Reads are unauthenticated against our own PDS via the public
 * `com.atproto.repo.listRecords` / `getRecord` endpoints; no login needed.
 *
 * Service URL and DID come from `runtimeConfig.atproto`, populated by the
 * shared `modules/atproto` module.
 */
import { AtpAgent } from '@atproto/api'
import { useNuxt } from 'nuxt/kit'

function cfg () {
  return useNuxt().options.runtimeConfig.atproto
}

let agent: AtpAgent | null = null
function getAgent (): AtpAgent {
  if (agent) return agent
  agent = new AtpAgent({ service: useNuxt().options.runtimeConfig.public.atproto.service })
  return agent
}

let didPromise: Promise<string> | null = null
async function getDid (): Promise<string> {
  if (didPromise) return didPromise
  const { did } = cfg()
  if (!did) {
    throw new Error(
      'runtimeConfig.atproto.did is not set; the build-time atproto module did not resolve it from social.networks.bluesky.identifier.',
    )
  }
  didPromise = Promise.resolve(did)
  return didPromise
}

export interface FetchedRecord<T> {
  uri: string
  cid: string
  value: T
}

/** Paginate through every record in `collection` on our PDS. */
export async function listAllRecords<T> (collection: string): Promise<FetchedRecord<T>[]> {
  const a = getAgent()
  const did = await getDid()
  const out: FetchedRecord<T>[] = []
  let cursor: string | undefined
  while (true) {
    const res = await a.com.atproto.repo.listRecords({
      repo: did,
      collection,
      limit: 100,
      cursor,
    })
    for (const r of res.data.records) {
      out.push({ uri: r.uri, cid: r.cid, value: r.value as T })
    }
    if (!res.data.cursor || res.data.records.length < 100) break
    cursor = res.data.cursor
  }
  return out
}
