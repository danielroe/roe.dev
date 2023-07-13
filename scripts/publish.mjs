/* eslint-disable camelcase */

import fsp from 'node:fs/promises'
import { globby } from 'globby'
import { $fetch } from 'ofetch'

const token = process.env.DEVTO_TOKEN

if (!token) {
  throw new Error('No token provided.')
}

const $devto = $fetch.create({
  baseURL: 'https://dev.to/api',
  headers: {
    'api-key': token,
  },
})

const serializers = new Map([
  [/\(\//g, '(https://roe.dev/'],
  [/ ---? /g, ' — '],
  [/::SocialPost\{link=([^ ]*)[\s\S]*?::/g, '$1'],
  [/:CalSchedule\{meeting=([^ ]*).*\}/g, 'https://cal.com/danielroe/$1'],
  [/(\n|^)---\n[\s\S]*\n---\n/, '\n'],
])

async function getMarkdownArticles() {
  const articles = []
  const files = await globby('./src/content/blog/**/*.md')
  for (const file of files) {
    let contents = await fsp.readFile(file, 'utf-8')

    if (contents.includes('skip_dev')) continue
    for (const item of serializers) {
      contents = contents.replace(item[0], item[1])
    }

    const slug = file.match(/\/[^/]*$/)?.[0].slice(1, -3)
    articles.push({
      body_markdown: contents,
      title: contents.match(/title: (.*)/)?.[1],
      slug,
      canonical_url: `https://roe.dev/blog/${slug}/`,
    })
  }
  return articles
}

function getArticles() {
  return $devto('articles/me')
}

async function postArticle({ title, body_markdown, canonical_url }) {
  return await $devto('articles', {
    method: 'POST',
    body: {
      article: {
        published: true,
        title,
        canonical_url,
        body_markdown,
      },
    },
  })
}

async function updateArticle(id, { title, body_markdown, canonical_url }) {
  return await $devto(`articles/${id}`, {
    method: 'PUT',
    body: {
      article: {
        published: true,
        title,
        body_markdown,
        canonical_url,
      },
    },
  })
}

async function main() {
  const [publishedArticles, localArticles] = await Promise.all([
    getArticles(),
    getMarkdownArticles(),
  ])
  for (const markdownArticle of localArticles) {
    const article = publishedArticles.find(
      article => article.canonical_url === markdownArticle.canonical_url
    )
    if (article) {
      await updateArticle(article.id, markdownArticle)
    } else {
      await postArticle(markdownArticle)
    }
  }
}

main()
