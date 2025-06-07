export default defineTask({
  meta: {
    name: 'sync:github-projects',
    description: 'Update project data from GitHub API',
  },
  async run ({ payload, context }) {
    console.log('Running GitHub projects sync task...')

    const config = useRuntimeConfig()
    const githubToken = config.github.token

    if (!githubToken) {
      throw new Error('GitHub token not configured')
    }

    try {
      const sanity = useSanity()

      // Fetch all projects that have GitHub repos
      const projects = await sanity.client.fetch(`
        *[_type == "project" && defined(githubRepo.owner) && defined(githubRepo.name)] {
          _id,
          name,
          githubRepo
        }
      `)

      const updates = []

      for (const project of projects) {
        try {
          const { owner, name } = project.githubRepo

          // Fetch latest repo data from GitHub
          const repoData = await $fetch<{
            html_url: string
            stargazers_count: number
            language: string
            updated_at: string
            description?: string
          }>(`https://api.github.com/repos/${owner}/${name}`, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          })

          // Update the project in Sanity
          const updateData: Record<string, any> = {
            'githubRepo.url': repoData.html_url,
            'githubRepo.stars': repoData.stargazers_count,
            'githubRepo.language': repoData.language,
            'githubRepo.lastUpdated': repoData.updated_at,
            'syncedAt': new Date().toISOString(),
          }

          // Only update description if it's empty
          if (!project.description && repoData.description) {
            updateData.description = repoData.description
          }

          await sanity.client
            .patch(project._id)
            .set(updateData)
            .commit()

          updates.push({
            id: project._id,
            name: project.name,
            repo: `${owner}/${name}`,
            stars: repoData.stargazers_count,
            language: repoData.language,
          })
        }
        catch (repoError: any) {
          console.error(`Failed to update project ${project.name}:`, repoError)
          updates.push({
            id: project._id,
            name: project.name,
            repo: `${project.githubRepo.owner}/${project.githubRepo.name}`,
            error: repoError?.message || 'Unknown error',
          })
        }
      }

      return {
        success: true,
        updated: updates.filter(u => !u.error).length,
        failed: updates.filter(u => u.error).length,
        details: updates,
        timestamp: new Date().toISOString(),
      }
    }
    catch (error) {
      console.error('GitHub sync error:', error)
      throw error
    }
  },
})
