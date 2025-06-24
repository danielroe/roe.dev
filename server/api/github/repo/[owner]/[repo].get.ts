export default defineEventHandler(async (event) => {
  const { owner, repo } = getRouterParams(event)

  if (!owner || !repo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Owner and repo parameters are required'
    })
  }

  const config = useRuntimeConfig()

  try {
    const data = await $fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${config.github.token}`,
        'User-Agent': 'roe.dev'
      }
    })

    return {
      stars: data.stargazers_count || 0,
      language: data.language || ''
    }
  } catch (error) {
    // Return default values if GitHub API fails
    console.warn(`Failed to fetch GitHub data for ${owner}/${repo}:`, error)
    return {
      stars: 0,
      language: ''
    }
  }
})
