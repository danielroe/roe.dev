import fsp from 'node:fs/promises'
import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import { globby } from 'globby'
import { $fetch } from 'ofetch'
import { resolve } from 'pathe'
import { serializers } from './shared/serialisers'

type RawArticle = {
  title: string
  body_markdown: string
  canonical_url: string
}

export default defineNuxtModule({
  meta: {
    name: 'dev-to',
    configKey: 'devTo',
  },
  defaults: {
    enabled: false,
    token: process.env.DEVTO_TOKEN,
  },
  async setup (options) {
    const nuxt = useNuxt()
    if (nuxt.options.dev || !options.enabled) {
      return
    }

    if (!options.token) {
      throw new Error('No token provided.')
    }

    const $devto = $fetch.create({
      baseURL: 'https://dev.to/api',
      headers: {
        'api-key': options.token,
      },
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

      await await $devto('articles', {
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
  },
})

async function getMarkdownArticles () {
  const nuxt = useNuxt()
  const articles = []
  const files = await globby('./content/blog/**/*.md', {
    cwd: nuxt.options.srcDir,
  })
  for (const file of files) {
    let contents = await fsp.readFile(
      resolve(nuxt.options.srcDir, file),
      'utf-8',
    )

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
