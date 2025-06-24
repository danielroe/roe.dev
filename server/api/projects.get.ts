interface GitHubRepoResponse {
  stargazers_count: number
  language: string | null
  description: string | null
  updated_at: string
}

async function fetchGitHubRepoData (owner: string, name: string) {
  const config = useRuntimeConfig()

  try {
    const response = await $fetch<GitHubRepoResponse>(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${config.github.token}`,
      },
    })

    return {
      stars: response.stargazers_count,
      language: response.language,
      description: response.description,
      updatedAt: response.updated_at,
    }
  }
  catch (error) {
    console.warn(`Failed to fetch GitHub data for ${owner}/${name}:`, error)
    return {
      stars: 0,
      language: null,
      description: null,
      updatedAt: null,
    }
  }
}

export default defineEventHandler(async event => {
  const sanity = useSanity(event)

  const projects = await sanity.client.fetch(`
    *[_type == "project" && isPrivate != true] | order(isFeatured desc, order asc, name asc) {
      _id,
      name,
      slug,
      description,
      logo,
      githubRepo,
      category,
      isPrivate,
      isFeatured,
      links,
      tags,
      order
    }
  `)

  // Fetch GitHub data for projects that have GitHub repositories
  const projectsWithGithubData = await Promise.all(
    projects.map(async (project: any) => {
      if (project.githubRepo?.owner && project.githubRepo?.name) {
        const githubData = await fetchGitHubRepoData(
          project.githubRepo.owner,
          project.githubRepo.name,
        )

        return {
          ...project,
          githubRepo: {
            ...project.githubRepo,
            ...githubData,
          },
        }
      }

      return project
    }),
  )

  return projectsWithGithubData
})
