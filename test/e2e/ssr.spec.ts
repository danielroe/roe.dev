import { test, expect } from '@playwright/test'
import { joinURL, withTrailingSlash } from 'ufo'

const baseURL = process.env.BASE_URL || 'https://roe.dev/'

const url = (path: string) => joinURL(baseURL, path)

const pages = [
  '/',
  '/talks',
  '/uses',
  '/work',
  '/blog',
  '/blog/introduction',
  '/blog/serverless-functions-nuxt-zeit-now',
  '/blog/good-ux-and-giving-birth',
  '/blog/building-your-own-vue-rich-text-component',
  '/blog/creating-your-own-sitemap-module',
  '/blog/open-invitation',
  '/blog/contributing-to-nuxt',
]

test.describe(`pages`, () => {
  for (const path of pages) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(url(path))

      const title = page.locator('title')
      expect(await title.textContent()).toContain('Daniel Roe')

      // Mask dynamic content
      const mask = []
      if (path === '/') {
        // Mask recent streams list on home page
        mask.push(page.locator('section:has(h2:text("some recent streams")) ul'))
      }

      await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.05, mask })
    })

    test(`image for ${path}`, async ({ page }) => {
      await page.goto(url(path))

      const ogImage = page.locator('[property="og:image"]').first()
      const ogURL = await ogImage.getAttribute('content')
      await page.goto(ogURL!.replace('https://roe.dev/', withTrailingSlash(baseURL)))
      await expect(page).toHaveScreenshot()
    })
  }
})
