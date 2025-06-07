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

export default defineTask({
  meta: {
    name: 'sync:advocu',
    description: 'Sync projects and blog posts to Advocu',
  },
  async run ({ payload, context }) {
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
      const blogPosts = await queryCollection('blog')
        .select('title', 'description', 'path')
        .all()

      // Format projects for Advocu
      const advocuProjects: AdvocuProject[] = projects.map((project: any) => ({
        title: project.name,
        description: project.description,
        url: project.githubRepo?.url || project.links?.[0]?.url,
        tags: project.tags || [],
        category: project.category,
        featured: project.isFeatured,
        metadata: {
          stars: project.githubRepo?.stars,
          language: project.githubRepo?.language,
          lastUpdated: project.githubRepo?.lastUpdated,
        },
      }))

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
        success: true,
        synced: {
          projects: advocuProjects.length,
          blogPosts: advocuBlogPosts.length,
        },
        timestamp: new Date().toISOString(),
        advocuResponse: response,
      }
    }
    catch (error) {
      console.error('Advocu sync error:', error)
      throw error
    }
  },
})
