interface AdvocuProject {
  title: string
  description?: string
  url?: string
  tags?: string[]
  category?: string
  featured?: boolean
  metadata?: {
    stars?: number
    language?: string
    lastUpdated?: string
  }
}

interface AdvocuBlogPost {
  title: string
  description?: string
  url: string
  publishedDate?: string
  tags?: string[]
  category?: string
}

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

export default defineTask({
  meta: {
    name: 'sync:advocu',
    description: 'Sync projects and blog posts to Advocu',
  },
  async run () {
    const event = useEvent()
    console.log('Running Advocu sync task...')

    const config = useRuntimeConfig()
    const advocuApiUrl = config.advocu?.apiUrl
    const advocuApiKey = config.advocu?.apiKey

    if (!advocuApiUrl || !advocuApiKey) {
      throw new Error('Advocu API configuration missing')
    }

    try {
      // Fetch projects from Sanity
      const sanity = useSanity()
      const projects = await sanity.client.fetch(`
        *[_type == "project" && isPrivate != true] | order(isFeatured desc, order asc, name asc) {
          _id,
          name,
          description,
          githubRepo,
          category,
          isFeatured,
          links,
          tags,
          order
        }
      `)

      // Fetch blog posts from Nuxt Content
      const blogPosts = await queryCollection(event, 'blog')
        .select('title', 'description', 'path')
        .all()

      // Format projects for Advocu with GitHub data
      const advocuProjects: AdvocuProject[] = await Promise.all(
        projects.map(async (project: any) => {
          let githubData = { stars: 0, language: null as string | null, updatedAt: null as string | null }

          if (project.githubRepo?.owner && project.githubRepo?.name) {
            githubData = await fetchGitHubRepoData(
              project.githubRepo.owner,
              project.githubRepo.name,
            )
          }

          return {
            title: project.name,
            description: project.description,
            url: project.githubRepo?.url || project.links?.[0]?.url,
            tags: project.tags || [],
            category: project.category,
            featured: project.isFeatured,
            metadata: {
              stars: githubData.stars,
              language: githubData.language,
              lastUpdated: project.githubRepo?.lastUpdated || githubData.updatedAt,
            },
          }
        }),
      )

      // Format blog posts for Advocu
      const advocuBlogPosts: AdvocuBlogPost[] = blogPosts.map((post: any) => ({
        title: post.title,
        description: post.description,
        url: `https://roe.dev${post.path}`,
        publishedDate: post.date,
        tags: post.tags || [],
        category: 'blog',
      }))

      // Send to Advocu API
      const syncData = {
        expert_id: config.advocu?.expertId,
        projects: advocuProjects,
        blog_posts: advocuBlogPosts,
        sync_timestamp: new Date().toISOString(),
      }

      const response = await $fetch(advocuApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${advocuApiKey}`,
        },
        body: syncData,
      })

      return {
        result: {
          success: true,
          synced: {
            projects: advocuProjects.length,
            blogPosts: advocuBlogPosts.length,
          },
          timestamp: new Date().toISOString(),
          advocuResponse: response,
        },
      }
    }
    catch (error) {
      console.error('Advocu sync error:', error)
      throw error
    }
  },
})
