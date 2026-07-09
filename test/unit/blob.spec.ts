import { describe, expect, it } from 'vitest'
import { BLUESKY_IMAGE_MAX_BYTES, blobSize, blobUrlFor, cidFromBlob } from '../../shared/cms/blob'

describe('cidFromBlob', () => {
  it('reads the IPLD-JSON blob shape', () => {
    expect(cidFromBlob({ $type: 'blob', ref: { $link: 'bafyabc' }, mimeType: 'image/png', size: 10 })).toBe('bafyabc')
  })

  it('returns null for non-blob input', () => {
    expect(cidFromBlob(null)).toBeNull()
    expect(cidFromBlob('nope')).toBeNull()
    expect(cidFromBlob({})).toBeNull()
  })
})

describe('blobSize', () => {
  it('reads the declared byte size', () => {
    expect(blobSize({ $type: 'blob', size: 1234 })).toBe(1234)
  })

  it('returns null when size is missing or not finite', () => {
    expect(blobSize({ $type: 'blob' })).toBeNull()
    expect(blobSize({ size: Number.NaN })).toBeNull()
    expect(blobSize(null)).toBeNull()
  })

  it('exposes the Bluesky embed limit as 1 MB', () => {
    expect(BLUESKY_IMAGE_MAX_BYTES).toBe(1_000_000)
  })
})

describe('blobUrlFor', () => {
  it('builds a getBlob URL and trims a trailing slash from the service', () => {
    expect(blobUrlFor('https://pds.example/', 'did:plc:abc', 'bafyabc')).toBe(
      'https://pds.example/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aabc&cid=bafyabc',
    )
  })
})
