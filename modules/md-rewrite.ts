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

        // Redirect requests with Accept: text/markdown to the .md version
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
