/**
 * Extract the base32 CID string from a blob ref. Accepts the IPLD-JSON
 * form (`{ ref: { $link: cid } }`) and a `BlobRef` instance with a `CID`
 * `ref`.
 */
export function cidFromBlob (blob: unknown): string | null {
  if (!blob || typeof blob !== 'object') return null
  const b = blob as Record<string, unknown>

  const ref = b.ref
  if (!ref) return null
  if (typeof ref === 'string') return ref
  if (typeof ref === 'object') {
    const r = ref as Record<string, unknown>
    if (typeof r.$link === 'string') return r.$link
    const s = String(ref)
    if (s && s !== '[object Object]') return s
  }
  return null
}

/** Build the PDS `getBlob` URL for a CID under a particular DID. */
export function blobUrlFor (service: string, did: string, cid: string): string {
  const base = service.replace(/\/$/, '')
  return `${base}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`
}

export const BLUESKY_IMAGE_MAX_BYTES = 1_000_000

export function blobSize (blob: unknown): number | null {
  if (!blob || typeof blob !== 'object') return null
  const size = (blob as { size?: unknown }).size
  return typeof size === 'number' && Number.isFinite(size) ? size : null
}
