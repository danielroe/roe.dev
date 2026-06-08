/**
 * Dev-only handler for `/slides/:id.pdf`.
 */
import { listRecords } from '#server/utils/atproto'

interface GitHubReleaseAsset {
  id: number
  name: string
}
interface GitHubRelease {
  assets: GitHubReleaseAsset[]
}

const assetCache = new Map<string, ArrayBuffer>()
let knownIds: Set<string> | null = null

async function getKnownSlideIds (event: Parameters<typeof listRecords>[0]): Promise<Set<string>> {
  if (knownIds) return knownIds
  const records = await listRecords(event, 'dev.roe.talk')
  knownIds = new Set(
    records
      .map(r => r.value.slides)
      .filter((s): s is string => Boolean(s)),
  )
  return knownIds
}

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const config = useRuntimeConfig(event)
  if (!config.github.token) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GitHub token not configured (NUXT_GITHUB_TOKEN); cannot serve slides in dev.',
    })
  }

  const known = await getKnownSlideIds(event)
  if (!known.has(id)) throw createError({ statusCode: 404 })

  setResponseHeader(event, 'content-type', 'application/pdf')

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
  if (!assetId) throw createError({ statusCode: 404 })

  const file = await $fetch<ArrayBuffer>(
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
