/**
 * Dev-only handler for `/slides/:id.pdf`.
 */
import { createError, defineEventHandler, getRouterParam, useRuntimeConfig } from 'nuxt/server'

import { useAirspace } from '#server/utils/airspace'
import { createGitHub, downloadSlides } from '#server/utils/github'

const assetCache = new Map<string, Uint8Array>()
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
  if (cached) return cached

  const file = await downloadSlides(createGitHub(config.github.token), id)
  if (!file) throw createError({ status: 404 })

  assetCache.set(id, file)
  return file
})
