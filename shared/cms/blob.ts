import { blobUrl, cidFromBlob } from 'airspace'
import type { Identity } from 'airspace'

export const BLUESKY_IMAGE_MAX_BYTES = 1_000_000

/** `community.lexicon.app.defs#image` rejects blobs larger than this. */
export const COMMUNITY_IMAGE_MAX_BYTES = 2_000_000

/**
 * Public URL for a blob already stored on the PDS, for previewing a record's
 * current image in the editor. Server-rendered pages should prefer
 * `airspace.blobs.image()`, which resolves the PDS itself.
 */
export function pdsBlobUrl (service: string | null | undefined, did: string | null | undefined, blob: unknown): string | null {
  const cid = cidFromBlob(blob)
  if (!service || !did || !cid) return null
  return blobUrl(service, did as Identity['did'], cid)
}
