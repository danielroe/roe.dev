/* eslint-disable camelcase */

import { $fetch } from 'ofetch'

import { iterateOnDirectory } from './global.mjs'

const url = 'https://dev.to/api'
const token = process.env.DEVTO_TOKEN || 'CYgR6zbcVgtKDRkawFYZKrCT'

async function getMarkdownArticles() {
  const articles = []
  await iterateOnDirectory('./src/content/blog', (path, contents) => {
    if (!/\.md$/.test(path)) return
    if (contents.includes('skip_dev')) return
    const slug = path.match(/\/[^/]*$/)?.[0].slice(1, -3)
    articles.push({
      body_markdown: contents
        .replace(/\(\//g, '(https://roe.dev/')
        .replace(/ ---? /g, ' — ')
        .replace(/::SocialPost\{link=([^ ]*)[\s\S]*?::/g, '$1')
        .replace(
          /:CalSchedule\{meeting=([^ ]*).*\}/g,
          'https://cal.com/danielroe/$1'
        )
        .replace(/(\n|^)---\n[\s\S]*\n---\n/, '\n'),
      title: contents.match(/title: (.*)/)?.[1],
      slug,
      canonical_url: `https://roe.dev/blog/${slug}/`,
    })
  })
  return articles
}

function getArticles() {
  return $fetch(`${url}/articles/me`, {
    headers: {
      'api-key': token,
    },
  })
}

async function postArticle({ title, body_markdown, canonical_url }) {
  try {
    return await $fetch(`${url}/articles`, {
      method: 'POST',
      body: {
        article: {
          published: true,
          title,
          canonical_url,
          body_markdown,
        },
      },
      headers: {
        'api-key': token,
      },
    })
  } catch (e) {
    console.log(e)
  }
}

async function updateArticle(id, { title, body_markdown, canonical_url }) {
  try {
    return await $fetch(`${url}/articles/${id}`, {
      method: 'PUT',
      body: {
        article: {
          published: true,
          title,
          body_markdown,
          canonical_url,
        },
      },
      headers: {
        'api-key': token,
      },
    })
  } catch (e) {
    console.log(e)
  }
}

getArticles().then(async articles => {
  const markdownArticles = await getMarkdownArticles()
  // console.log('TCL: markdownArticles', markdownArticles)
  for (const markdownArticle of markdownArticles) {
    const article = articles.find(
      article => article.canonical_url === markdownArticle.canonical_url
    )
    // console.log('TCL: article', article)
    if (article) {
      await updateArticle(article.id, markdownArticle)
    } else {
      await postArticle(markdownArticle)
    }
  }
})
