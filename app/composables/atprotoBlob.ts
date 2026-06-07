/**
 * Helpers for building public URLs to PDS blobs (images stored on
 * `dev.roe.*` records). Use the URL as the `src` of `<NuxtImg>` for
 * responsive sizing - `nuxt.config.ts` allowlists `npmx.social` so the
 * ipxStatic provider can fetch + resize.
 */
import { blobUrlFor, cidFromBlob } from '#shared/cms/blob'

/**
 * Resolve a blob ref to the public PDS URL for its bytes, or `null` if the
 * blob is missing or the CID can't be extracted. Reads `service` + `did`
 * from public runtime config.
 */
export function useAtprotoBlobUrl (blob: unknown): string | null {
  const { public: publicConfig } = useRuntimeConfig()
  const service = publicConfig.atproto?.service
  const did = publicConfig.atproto?.did
  if (!service || !did) return null

  const cid = cidFromBlob(blob)
  if (!cid) return null

  return blobUrlFor(service, did, cid)
}
