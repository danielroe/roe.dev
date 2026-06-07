/**
 * List releases from danielroe/slides for the talk-editor slides datalist.
 */
import { requireAdminAgent } from '../../utils/admin/agent'

interface GitHubRelease {
  tag_name: string
  name: string | null
  published_at: string | null
  draft: boolean
}

export default defineEventHandler(async event => {
  await requireAdminAgent(event)

  const config = useRuntimeConfig(event)
  if (!config.github.token) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GitHub token not configured (NUXT_GITHUB_TOKEN). Slides dropdown will be empty.',
    })
  }

  try {
    const releases = await $fetch<GitHubRelease[]>(
      'https://api.github.com/repos/danielroe/slides/releases?per_page=100',
      {
        headers: {
          'Authorization': `token ${config.github.token}`,
          'User-Agent': 'roe.dev-admin',
          'Accept': 'application/vnd.github+json',
        },
      },
    )

    return releases
      .filter(r => !r.draft)
      .map(r => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        publishedAt: r.published_at,
      }))
  }
  catch (err) {
    console.error('[admin] github-releases fetch failed:', err)
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub API error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
})
