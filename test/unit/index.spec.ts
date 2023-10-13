import { describe, it, expect } from 'vitest'

describe('something', () => {
  it('works', () => {
    expect(useAppConfig()).toEqual({
      nuxt: {},
    })
  })
})
