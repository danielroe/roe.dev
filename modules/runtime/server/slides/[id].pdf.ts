/**
 * Dev-only handler for `/slides/:id.pdf`.
 */
import { createError, defineEventHandler, getRouterParam, useRuntimeConfig } from 'nuxt/server'
import { $fetch } from 'ofetch'

import { useAirspace } from '#server/utils/airspace'

interface GitHubReleaseAsset {
  id: number
  name: string
}
interface GitHubRelease {
  assets: GitHubReleaseAsset[]
}

const assetCache = new Map<string, ArrayBuffer>()
let knownIds: Set<string> | null = null

async function getKnownSlideIds (): Promise<Set<string>> {
  if (knownIds) return knownIds
  const records = await useAirspace().talks.list()
  knownIds = new Set(
    records
      .map(r => r.value.slides)
      .filter((s): s is string => Boolean(s)),
  )
  return knownIds
}

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ status: 404 })

  const config = useRuntimeConfig()
  if (!config.github.token) {
    throw createError({
      status: 503,
      statusText: 'GitHub token not configured (NUXT_GITHUB_TOKEN); cannot serve slides in dev.',
    })
  }

  const known = await getKnownSlideIds()
  if (!known.has(id)) throw createError({ status: 404 })

  event.res.headers.set('content-type', 'application/pdf')

  const cached = assetCache.get(id)
  if (cached) return new Uint8Array(cached)

  const release = await $fetch<GitHubRelease>(
    `https://api.github.com/repos/danielroe/slides/releases/tags/${id}`,
    {
      headers: {
        'Authorization': `token ${config.github.token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'roe.dev-dev',
      },
    },
  )

  const assetId = release.assets.find(a => a.name.endsWith('.pdf'))?.id
  if (!assetId) throw createError({ status: 404 })

  const file = await $fetch(
    `https://api.github.com/repos/danielroe/slides/releases/assets/${assetId}`,
    {
      responseType: 'arrayBuffer',
      headers: {
        'Authorization': `token ${config.github.token}`,
        'Accept': 'application/octet-stream',
        'User-Agent': 'roe.dev-dev',
      },
    },
  )

  assetCache.set(id, file)
  return new Uint8Array(file)
})
