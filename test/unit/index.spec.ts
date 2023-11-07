import { describe, it, expect } from 'vitest'

describe('something', () => {
  it('works', () => {
    expect(Object.keys(useAppConfig())).toEqual(['nuxt'])
  })
})
