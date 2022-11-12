import { writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { defineNuxtModule, useNuxt } from '@nuxt/kit'
import { join } from 'pathe'

export default defineNuxtModule({
  meta: {
    name: 'sitemap',
  },
  setup () {
    const nuxt = useNuxt()
    nuxt.hook('nitro:init', nitro => {
      nitro.hooks.hook('close', async () => {
        const routes = nitro._prerenderedRoutes
          ?.filter(r => r.fileName?.endsWith('.html'))
          .map(r => r.route)
        if (!routes?.length) return
        const timestamp = new Date().toISOString()
        const sitemap = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...routes.map(
            route =>
              `<url><loc>https://roe.dev${route}</loc><lastmod>${timestamp}</lastmod></url>`
          ),
          `</urlset>`,
        ].join('')
        const dir = nitro.options.output.publicDir
        await writeFile(join(dir, 'sitemap.xml'), sitemap)
        await writeFile(join(dir, 'sitemap.xml.gz'), gzipSync(sitemap))
      })
    })
  },
})
