import { defineNuxtModule, useNuxt, useRuntimeConfig } from 'nuxt/kit'
import { $fetch } from 'ofetch'
import { put, head } from '@vercel/blob'
import { createClient } from '@sanity/client'

export default defineNuxtModule({
  meta: {
    name: 'slides',
  },
  async setup () {
    const nuxt = useNuxt()
    const config = useRuntimeConfig()

    if (!config.github.token || nuxt.options._prepare) return

    const $gh = $fetch.create({
      baseURL: 'https://api.github.com/repos/danielroe/slides/releases',
      headers: {
        Authorization: `token ${config.github.token}`,
      },
    })

    const token = config.blobReadWriteToken

    const sanityClient = createClient({
      projectId: '9bj3w2vo',
      dataset: 'production',
      apiVersion: '2025-01-01',
      useCdn: false,
      token: process.env.NUXT_SANITY_TOKEN,
    })

    const talks = await sanityClient.fetch(`
      *[_type == "talk" && defined(slides)] {
        _id,
        slides,
        "release": slides
      }
    `)

    for (const talk of talks) {
      if (!talk.release) continue

      const pathname = `slides/${talk.release}.pdf`

      const existingBlob = await head(pathname, { token }).catch(() => null)
      if (!existingBlob) {
        const release = await $gh<GitHubRelease>(`/tags/${talk.release}`)
        const id = release?.assets.find(a => a.name.endsWith('.pdf'))?.id

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
        nuxt.options.routeRules[`/slides/${talk.release}.pdf`] = {
          redirect: blob.url,
        }
      }
      else {
        // File already exists, set up route rule with existing blob URL
        nuxt.options.routeRules ||= {}
        nuxt.options.routeRules[`/slides/${talk.release}.pdf`] = {
          redirect: existingBlob.url,
        }
      }
    }
  },
})

interface GitHubRelease {
  assets: Array<{ id: number, name: string }>
}
