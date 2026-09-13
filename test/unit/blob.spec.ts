import { describe, expect, it } from 'vitest'
import { BLUESKY_IMAGE_MAX_BYTES, COMMUNITY_IMAGE_MAX_BYTES } from '../../shared/cms/blob'

describe('image size limits', () => {
  it('exposes the Bluesky embed limit as 1 MB', () => {
    expect(BLUESKY_IMAGE_MAX_BYTES).toBe(1_000_000)
  })

  it('exposes the community image limit as 2 MB', () => {
    expect(COMMUNITY_IMAGE_MAX_BYTES).toBe(2_000_000)
  })
})
