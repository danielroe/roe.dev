/** @vitest-environment node */
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  nuxtConfig: {
    sourcemap: false,
    nitro: {
      prerender: {
        crawlLinks: false,
      },
    },
    hooks: {
      'prerender:routes' (routes) {
        routes.routes.clear()
        routes.routes.add('/')
      },
    },
  },
})

describe('site behaviour', { timeout: 10000 }, () => {
  it('renders server components', async () => {
    const logs: string[] = []
    const page = await createPage()
    await page.route('**/feed/_payload.json', route =>
      route.fulfill({
        json: [{ data: 2, prerenderedAt: 3 }, {}, 1689517334625],
      }),
    )
    page.on('console', msg => logs.push(msg.text()))
    await page.goto(url('/'))
    await page.waitForLoadState('networkidle')
    const year = new Date().getFullYear()
    expect(await page.getByText(`2019-${year}`).innerHTML()).toMatchInlineSnapshot(
      `" © 2019-${year} Daniel Roe. <a class="underlined-link" href="https://creativecommons.org/licenses/by-sa/4.0/"> CC BY-SA 4.0 </a>"`,
    )
    expect(logs).toMatchInlineSnapshot(`[]`)
    await page.close()
  })

  it('renders blog posts navigated to on the client', async () => {
    const errors: string[] = []
    const page = await createPage()
    await page.route('**/api/discover-bluesky-post', route =>
      route.fulfill({ json: { uri: null } }),
    )
    page.on('pageerror', error => errors.push(error.message))

    await page.goto(url('/blog/'))
    await page.waitForLoadState('networkidle')

    const link = page.locator('main a[href^="/blog/"]').first()
    const title = await link.getAttribute('title')

    // the post metadata is only in the route payload, so a client-side
    // navigation that fails to load it renders nothing at all
    const rendered = page.locator('h1', { hasText: title! }).waitFor()
    await link.click()
    await Promise.race([rendered, page.waitForEvent('pageerror')]).catch(() => {})

    expect(errors).toStrictEqual([])
    expect(await page.locator('h1').textContent()).toBe(title)
    expect(await page.locator('section p').count()).toBeGreaterThan(0)
    await page.close()
  })
})
