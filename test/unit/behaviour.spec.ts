/** @vitest-environment node */
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  nuxtConfig: {
    nitro: {
      prerender: {
        crawlLinks: false,
      },
    },
    hooks: {
      'prerender:routes'(routes) {
        routes.routes.clear()
        routes.routes.add('/')
      },
    },
  },
})

describe('site behaviour', () => {
  it('renders server components', async () => {
    const page = await createPage('/')
    await page.waitForLoadState('networkidle')
    expect(await page.getByText('2019-2023').innerHTML()).toMatchInlineSnapshot(
      '" © 2019-2023 Daniel Roe. <a class=\\"link\\" href=\\"https://creativecommons.org/licenses/by-nc-sa/4.0/\\"> CC BY-SA 4.0 </a>"'
    )
  })
})
