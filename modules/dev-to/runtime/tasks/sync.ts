import fsp from 'node:fs/promises'
import { globby } from 'globby'
import { $fetch } from 'ofetch'
import { serializers } from '../../../shared/serialisers'

interface RawArticle {
  title: string
  body_markdown: string
  canonical_url: string
}

export default defineTask({
  meta: {
    name: 'dev-to:sync',
    description: 'Sync local blog articles to dev.to',
  },
  async run () {
    const token = process.env.DEVTO_TOKEN
    if (!token) {
      throw new Error('No DEVTO_TOKEN provided.')
    }

    const $devto = $fetch.create({
      baseURL: 'https://dev.to/api',
      headers: { 'api-key': token },
    })

    const [publishedArticles, localArticles] = await Promise.all([
      $devto<Array<RawArticle & { id: string }>>('articles/me'),
      getMarkdownArticles(),
    ])

    for (const markdownArticle of localArticles) {
      const article = publishedArticles.find(
        article => article.canonical_url === markdownArticle.canonical_url,
      )
      if (article) {
        if (
          markdownArticle.body_markdown === article.body_markdown
          && markdownArticle.title === article.title
          && markdownArticle.canonical_url === article.canonical_url
        ) {
          console.log('No changes detected for article:', markdownArticle.title)
          continue
        }

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
        continue
      }

      console.log(`Publishing new article: ${markdownArticle.title}`)
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
    }
    return { result: { status: 'done', count: localArticles.length } }
  },
})

async function getMarkdownArticles () {
  const rootDir = process.cwd()
  const articles = []
  const files = await globby('./content/blog/**/*.md', {
    cwd: rootDir,
    absolute: true,
  })
  for (const file of files) {
    let contents = await fsp.readFile(file, 'utf-8')
    if (contents.includes('skip_dev')) continue
    const title = contents.match(/title: (.*)/)?.[1] || 'Untitled'
    for (const item of serializers) {
      contents = contents.replace(item[0], item[1])
    }
    const slug = file.match(/\/([^/]*)$/)?.[1].replace(/\.md$/, '') || ''
    articles.push({
      body_markdown: contents,
      title,
      slug,
      canonical_url: `https://roe.dev/blog/${slug}/`,
    })
  }
  return articles
}
