export default defineTask({
  meta: {
    name: 'sync:github-stars',
    description: 'Sync projects and blog posts to GitHub Stars',
  },
  async run () {
    const event = useEvent()
    console.log('Running GitHub Stars sync task...')

    const config = useRuntimeConfig()
    const githubStarsToken = config.githubStars?.token
    const githubStarsApiUrl = config.githubStars?.apiUrl

    if (!githubStarsToken || !githubStarsApiUrl) {
      return {
        result: {
          success: false,
          message: 'GitHub Stars API credentials not configured',
          synced: 0,
          existing: 0,
        },
      }
    }

    try {
      // Get existing contributions to avoid duplicates
      const existingContributionsResponse = await $fetch<{
        data?: {
          contributions?: Array<{
            id: string
            title: string
            url: string
            type: string
            date: string
          }>
        }
        errors?: Array<{ message: string }>
      }>(githubStarsApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubStarsToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          query: `
            query {
              contributions {
                id
                title
                url
                type
                date
              }
            }
          `,
        },
      })

      const existingContributions = existingContributionsResponse?.data?.contributions || []
      const existingUrls = new Set(existingContributions.map(c => c.url))

      const contributions: Array<{
        title: string
        url: string
        description: string
        type: string
        date: string
      }> = []

      // Fetch featured projects from Sanity
      try {
        const sanity = useSanity()
        const projects = await sanity.client.fetch(`
          *[_type == "project" && isPrivate != true && isFeatured == true] {
            _id,
            name,
            description,
            githubRepo,
            links,
            _createdAt
          }
        `)

        // Add projects as OPEN_SOURCE_PROJECT contributions
        for (const project of projects) {
          const projectUrl = project.githubRepo?.url || project.links?.find((l: any) => l.type === 'demo')?.url

          if (projectUrl && !existingUrls.has(projectUrl)) {
            contributions.push({
              title: project.name,
              url: projectUrl,
              description: project.description || `Open source project: ${project.name}`,
              type: 'OPEN_SOURCE_PROJECT',
              date: project._createdAt || new Date().toISOString(),
            })
          }
        }
      }
      catch (projectError) {
        console.warn('Failed to fetch projects:', projectError)
      }

      // Fetch blog posts from content
      try {
        const blogPosts = await queryCollection(event, 'blog')
          .select('title', 'description', 'path')
          .all()

        // Add blog posts as BLOGPOST contributions
        for (const post of blogPosts) {
          const postUrl = `https://roe.dev${post.path}`

          if (!existingUrls.has(postUrl)) {
            contributions.push({
              title: post.title,
              url: postUrl,
              description: post.description || `Blog post: ${post.title}`,
              type: 'BLOGPOST',
              date: new Date().toISOString(),
            })
          }
        }
      }
      catch (blogError) {
        console.warn('Failed to fetch blog posts:', blogError)
      }

      if (contributions.length === 0) {
        return {
          result: {
            success: true,
            message: 'No new contributions to sync',
            synced: 0,
            existing: existingContributions.length,
          },
        }
      }

      // Create contributions in GitHub Stars
      const mutation = `
        mutation {
          createContributions(data: [
            ${contributions.map(c => `{
              title: ${JSON.stringify(c.title)}
              url: ${JSON.stringify(c.url)}
              description: ${JSON.stringify(c.description)}
              type: ${c.type}
              date: ${JSON.stringify(c.date)}
            }`).join('\n            ')}
          ]) {
            id
          }
        }
      `

      const createResponse = await $fetch<{
        data?: {
          createContributions?: Array<{ id: string }>
        }
        errors?: Array<{ message: string }>
      }>(githubStarsApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubStarsToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          query: mutation,
        },
      })

      if (createResponse.errors) {
        console.error('GitHub Stars API errors:', createResponse.errors)
        throw new Error(`GitHub Stars API error: ${createResponse.errors.map(e => e.message).join(', ')}`)
      }

      return {
        result: {
          success: true,
          message: `Successfully synced ${contributions.length} contributions`,
          synced: contributions.length,
          existing: existingContributions.length,
          contributions: contributions.map(c => ({
            title: c.title,
            url: c.url,
            type: c.type,
          })),
          timestamp: new Date().toISOString(),
        },
      }
    }
    catch (error) {
      console.error('GitHub Stars sync error:', error)
      return {
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          synced: 0,
          existing: 0,
        },
      }
    }
  },
})
