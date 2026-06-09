import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineNuxtModule({
  meta: {
    name: 'md-rewrite',
  },
  setup () {
    const nuxt = useNuxt()

    nuxt.hook('nitro:init', nitro => {
      if (nitro.options.dev || !nitro.options.preset.includes('vercel')) {
        return
      }

      nitro.hooks.hook('compiled', async () => {
        const vcJSON = resolve(nitro.options.output.dir, 'config.json')
        const vcConfig = JSON.parse(await readFile(vcJSON, 'utf8'))

        // Redirect Accept: text/markdown requests to the .md
        // version. A redirect gives the markdown response its own URL and
        // therefore its own edge cache key, so a markdown-accepting client
        // can't poison the HTML cache entry for the bare URL.
        // The home page needs special handling: / -> /index.md
        vcConfig.routes.unshift({
          src: '^/$',
          status: 302,
          headers: { Location: '/index.md' },
          has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
        }, {
          src: '^/(.+?)/?$',
          status: 302,
          headers: { Location: '/$1.md' },
          has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
        })

        await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
      })
    })
  },
})
