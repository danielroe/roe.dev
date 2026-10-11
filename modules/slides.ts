import { addServerHandler, createResolver, defineNuxtModule, useNuxt, useRuntimeConfig } from 'nuxt/kit'
import { put, head } from '@vercel/blob'

import { createGitHub, downloadSlides } from '../server/utils/github.ts'
import { useBuildAirspace } from './shared/airspace.ts'

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

    const gh = createGitHub(config.github.token)

    const token = config.blobReadWriteToken

    const releases = await fetchSlideReleases()

    for (const release of releases) {
      const pathname = `slides/${release}.pdf`

      const existingBlob = await head(pathname, { token }).catch(() => null)
      if (!existingBlob) {
        const file = await downloadSlides(gh, release)

        if (!file) continue

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
  const records = await useBuildAirspace().talks.list()
  return records
    .map(r => r.value.slides)
    .filter((s): s is string => Boolean(s))
}
