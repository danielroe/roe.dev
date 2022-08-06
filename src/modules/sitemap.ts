import { writeFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import { defineNuxtModule, useNuxt } from '@nuxt/kit'
import { join } from 'pathe'

export default defineNuxtModule({
  meta: {
    name: 'sitemap',
  },
  setup() {
    const nuxt = useNuxt()
    const routes: string[] = []
    nuxt.hook('nitro:init', nitro => {
      nitro.hooks.hook('prerender:route', route => {
        if (!route.route.includes('/api')) {
          routes.push(route.route)
        }
      })
      nitro.hooks.hook('close', async () => {
        const timestamp = new Date().toISOString()
        const sitemap = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
          ...routes.map(
            route =>
              `<url><loc>https://roe.dev${route}</loc><lastmod>${timestamp}</lastmod></url>`
          ),
          `</urlset>`,
        ].join('')
        await writeFile(
          join(nitro.options.output.publicDir, 'sitemap.xml'),
          sitemap
        )
        await writeFile(
          join(nitro.options.output.publicDir, 'sitemap.xml.gz'),
          gzipSync(sitemap)
        )
      })
    })
  },
})
