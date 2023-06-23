/** @vitest-environment node */
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  nuxtConfig: {
    hooks: {
      'prerender:routes'(routes) {
        routes.routes.clear()
      },
    },
  },
})

describe('site behaviour', () => {
  it('renders server components', async () => {
    const page = await createPage('/')
    await page.waitForLoadState('networkidle')
    expect(
      await page.getByText('All rights reserved').innerHTML()
    ).toMatchInlineSnapshot('"© 2019-2023 Daniel Roe. All rights reserved."')
  })
})
