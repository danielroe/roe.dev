import { addServerHandler, createResolver, defineNuxtModule, useNuxt, useRuntimeConfig } from 'nuxt/kit'
import { $fetch } from 'ofetch'
import { put, head } from '@vercel/blob'

import { listAllRecords } from './shared/atproto-read'
import type { DevRoeTalk } from '../shared/lex'

export default defineNuxtModule({
  meta: {
    name: 'slides',
  },
  async setup () {
    const nuxt = useNuxt()
    const config = useRuntimeConfig()

    if (!config.github.token || nuxt.options._prepare || nuxt.options.test) return

    if (nuxt.options.dev) {
      const resolver = createResolver(import.meta.url)
      addServerHandler({
        route: '/slides/:id.pdf',
        handler: resolver.resolve('./runtime/server/slides/[id].pdf'),
      })
      return
    }

    const $gh = $fetch.create({
      baseURL: 'https://api.github.com/repos/danielroe/slides/releases',
      headers: {
        Authorization: `token ${config.github.token}`,
      },
    })

    const token = config.blobReadWriteToken

    const releases = await fetchSlideReleases()

    for (const release of releases) {
      const pathname = `slides/${release}.pdf`

      const existingBlob = await head(pathname, { token }).catch(() => null)
      if (!existingBlob) {
        const ghRelease = await $gh<GitHubRelease>(`/tags/${release}`)
        const id = ghRelease?.assets.find(a => a.name.endsWith('.pdf'))?.id

        if (!id) continue

        const file = await $gh(`/assets/${id}`, {
          responseType: 'arrayBuffer',
          headers: { Accept: 'application/octet-stream' },
        })

        // Upload file to Vercel Blob
        const blob = await put(pathname, Buffer.from(file), {
          access: 'public',
          token,
          contentType: 'application/pdf',
        })

        nuxt.options.routeRules ||= {}
        nuxt.options.routeRules[`/slides/${release}.pdf`] = {
          redirect: blob.url,
        }
      }
      else {
        // File already exists, set up route rule with existing blob URL
        nuxt.options.routeRules ||= {}
        nuxt.options.routeRules[`/slides/${release}.pdf`] = {
          redirect: existingBlob.url,
        }
      }
    }
  },
})

async function fetchSlideReleases (): Promise<string[]> {
  const records = await listAllRecords<DevRoeTalk.Record>('dev.roe.talk')
  return records
    .map(r => r.value.slides)
    .filter((s): s is string => Boolean(s))
}

interface GitHubRelease {
  assets: Array<{ id: number, name: string }>
}
