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
import { Client, asStringFormat } from '@atproto/lex'
import type { AtUriString, CidString, DidString, Infer, RecordSchema } from '@atproto/lex'
import { useNuxt } from 'nuxt/kit'

let client: Client | null = null
function getClient (): Client {
  if (client) return client
  client = new Client(useNuxt().options.runtimeConfig.public.atproto.service)
  return client
}

let didPromise: Promise<DidString> | null = null
function getDid (): Promise<DidString> {
  if (didPromise) return didPromise
  const { did } = useNuxt().options.runtimeConfig.atproto
  if (!did) {
    throw new Error(
      'runtimeConfig.atproto.did is not set; the build-time atproto module did not resolve it from social.networks.bluesky.identifier.',
    )
  }
  didPromise = Promise.resolve(asStringFormat(did, 'did'))
  return didPromise
}

export interface FetchedRecord<T> {
  uri: AtUriString
  cid: CidString
  value: T
}

/** Paginate through every record in `collection` on our PDS. */
export async function listAllRecords<T extends RecordSchema> (schema: T): Promise<FetchedRecord<Infer<T>>[]> {
  const c = getClient()
  const did = await getDid()
  const out: FetchedRecord<Infer<T>>[] = []
  for await (const r of c.listAll(schema, { repo: did, limit: 100 })) {
    out.push({ uri: r.uri, cid: r.cid, value: r.value as Infer<T> })
  }
  return out
}
