/** @vitest-environment node */
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

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

describe(
  'site behaviour',
  () => {
    it('renders server components', async () => {
      const logs: string[] = []
      const page = await createPage()
      await page.route('**/feed/_payload.json', route =>
        route.fulfill({
          json: [{ data: 2, prerenderedAt: 3 }, {}, 1689517334625],
        })
      )
      page.on('console', msg => logs.push(msg.text()))
      await page.goto(url('/'))
      await page.waitForLoadState('networkidle')
      expect(
        await page.getByText('2019-2023').innerHTML()
      ).toMatchInlineSnapshot(
        '" © 2019-2023 Daniel Roe. <a class="underlined-link" href="https://creativecommons.org/licenses/by-sa/4.0/"> CC BY-SA 4.0 </a>"'
      )
      expect(logs).toMatchInlineSnapshot(`
        [
          "[Plausible] Ignoring event because website is running locally",
        ]
      `)
    })
  },
  { timeout: 10000 }
)
