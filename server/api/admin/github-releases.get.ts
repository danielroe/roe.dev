/**
 * List releases from danielroe/slides for the talk-editor slides datalist.
 */
import { createError, defineEventHandler, useRuntimeConfig } from 'nuxt/server'

import { requireAdminSession } from '../../utils/admin/oauth'
import { createGitHub, SLIDES_REPO } from '../../utils/github'

export default defineEventHandler(async event => {
  await requireAdminSession(event)

  const config = useRuntimeConfig()
  if (!config.github.token) {
    throw createError({
      status: 503,
      statusText: 'GitHub token not configured (NUXT_GITHUB_TOKEN). Slides dropdown will be empty.',
    })
  }

  try {
    const releases = await Array.fromAsync(createGitHub(config.github.token).releases.list(SLIDES_REPO, { perPage: 100 }))

    return releases
      .filter(r => !r.isDraft)
      .map(r => ({
        tag: r.tag,
        name: r.name || r.tag,
        publishedAt: r.publishedAt?.toISOString() ?? null,
      }))
  }
  catch (err) {
    console.error('[admin] github-releases fetch failed:', err)
    throw createError({
      status: 502,
      statusText: `GitHub API error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
})
