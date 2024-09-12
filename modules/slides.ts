import { existsSync, promises as fsp } from 'node:fs'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import { $fetch } from 'ofetch'
import { join } from 'pathe'

export default defineNuxtModule({
  meta: {
    name: 'slides',
  },
  async setup () {
    const nuxt = useNuxt()
    if (!process.env.NUXT_GITHUB_TOKEN) return

    const $gh = $fetch.create({
      baseURL: 'https://api.github.com/repos/danielroe/slides/releases',
      headers: {
        Authorization: `token ${process.env.NUXT_GITHUB_TOKEN}`,
      },
    })

    const slidesDir = join(nuxt.options.rootDir, 'node_modules/.cache/slides')
    await fsp.mkdir(slidesDir, { recursive: true })

    nuxt.options.nitro.publicAssets ||= []
    nuxt.options.nitro.publicAssets.push({
      dir: slidesDir,
      maxAge: 1000 * 60 * 60 * 24 * 365,
      baseURL: '/slides',
    })

    const talks = await import('../app/data/talks.json').then(r => r.default)

    for (const talk of talks) {
      if (!talk.release) continue

      if (existsSync(join(slidesDir, `${talk.release}.pdf`))) continue

      const release = await $gh<GitHubRelease>(`/tags/${talk.release}`)
      const id = release?.assets.find(a => a.name.endsWith('.pdf'))?.id

      if (id) {
        const file = await $gh(`/assets/${id}`, {
          responseType: 'arrayBuffer',
          headers: { Accept: 'application/octet-stream' },
        })
        await fsp.writeFile(
          join(slidesDir, `${talk.release}.pdf`),
          new Uint8Array(file),
        )
      }
    }
  },
})

interface GitHubRelease {
  assets: Array<{ id: number, name: string }>
}
