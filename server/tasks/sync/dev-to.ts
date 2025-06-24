import fsp from 'node:fs/promises'
import { globby } from 'globby'

const serializers = new Map([
  [/\(\//g, '(https://roe.dev/'],
  [/ ---? /g, ' — '],
  [/::SocialPost\{link=([^ ]*)[\s\S]*?::/g, '$1'],
  [/:CalSchedule\{meeting=([^ ]*).*\}/g, 'https://cal.com/danielroe/$1'],
  [/(\n|^)---\n[\s\S]*\n---\n/, '\n'],
])

type RawArticle = {
  title: string
  body_markdown: string
  canonical_url: string
}

export default defineTask({
  meta: {
    name: 'sync:dev-to',
    description: 'Sync blog posts to Dev.to',
  },
  async run () {
    console.log('Running Dev.to sync task...')

    const config = useRuntimeConfig()
    const devToToken = config.devTo?.token || process.env.DEVTO_TOKEN

    if (!devToToken) {
      throw new Error('Dev.to token not configured')
    }

    try {
      const $devto = $fetch.create({
        baseURL: 'https://dev.to/api',
        headers: {
          'api-key': devToToken,
        },
      })

      const [publishedArticles, localArticles] = await Promise.all([
        $devto<Array<RawArticle & { id: string }>>('articles/me'),
        getMarkdownArticles(),
      ])

      const results = {
        updated: 0,
        created: 0,
        skipped: 0,
        errors: [] as string[],
      }

      for (const markdownArticle of localArticles) {
        try {
          const article = publishedArticles.find(
            article => article.canonical_url === markdownArticle.canonical_url,
          )

          if (article) {
            // Update existing article
            await $devto(`articles/${article.id}`, {
              method: 'PUT',
              body: {
                article: {
                  published: true,
                  title: markdownArticle.title,
                  body_markdown: markdownArticle.body_markdown,
                  canonical_url: markdownArticle.canonical_url,
                },
              },
            })
            results.updated++
          }
          else {
            // Create new article
            await $devto('articles', {
              method: 'POST',
              body: {
                article: {
                  published: true,
                  title: markdownArticle.title,
                  canonical_url: markdownArticle.canonical_url,
                  body_markdown: markdownArticle.body_markdown,
                },
              },
            })
            results.created++
          }
        }
        catch (error: any) {
          console.error(`Failed to sync article "${markdownArticle.title}":`, error)
          results.errors.push(`${markdownArticle.title}: ${error.message}`)
        }
      }

      return {
        result: {
          success: true,
          results,
          timestamp: new Date().toISOString(),
        },
      }
    }
    catch (error) {
      console.error('Dev.to sync error:', error)
      throw error
    }
  },
})

async function getMarkdownArticles () {
  const articles = []
  const files = await globby('./content/blog/**/*.md', {
    cwd: process.cwd(),
    absolute: true,
  })

  for (const file of files) {
    let contents = await fsp.readFile(file, 'utf-8')

    if (contents.includes('skip_dev')) continue
    const title = contents.match(/title: (.*)/)![1]

    for (const item of serializers) {
      contents = contents.replace(item[0], item[1])
    }

    const slug = file.match(/\/[^/]*$/)![0].slice(1, -3)
    articles.push({
      body_markdown: contents,
      title,
      slug,
      canonical_url: `https://roe.dev/blog/${slug}/`,
    })
  }

  return articles
}
