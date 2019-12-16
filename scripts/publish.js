const axios = require('axios')

const { getMatchOrReturn, iterateOnDirectory } = require('../src/utils/global')

const url = 'https://dev.to/api'
const token = process.env.DEVTO_TOKEN || 'CYgR6zbcVgtKDRkawFYZKrCT'

async function getMarkdownArticles() {
  const articles = []
  iterateOnDirectory('../src/pages/blog/articles', (path, contents) => {
    if (!/\.md$/.test(path)) return
    const slug = getMatchOrReturn(path, /\/[^/]*$/, 0).slice(1, -3)
    articles.push({
      body_markdown: contents,
      title: getMatchOrReturn(contents, /title: (.*)/, 1),
      slug,
      canonical_url: `https://roe.dev/blog/${slug}/`,
    })
  })
  return articles
}

async function getArticles() {
  const { data } = await axios.get(`${url}/articles/me`, {
    headers: {
      'api-key': token,
    },
  })
  return data
}

async function postArticle({ title, body_markdown, canonical_url }) {
  try {
    const { data } = await axios.post(
      `${url}/articles`,
      {
        article: {
          published: true,
          title,
          canonical_url,
          body_markdown,
        },
      },
      {
        headers: {
          'api-key': token,
        },
      },
    )
    return data
  } catch (e) {
    console.log(e)
  }
}

async function updateArticle(id, { title, body_markdown, canonical_url }) {
  try {
    const { data } = await axios.put(
      `${url}/articles/${id}`,
      {
        article: {
          published: true,
          title,
          body_markdown,
          canonical_url,
        },
      },
      {
        headers: {
          'api-key': token,
        },
      },
    )
    return data
  } catch (e) {
    console.log(e)
  }
}

getArticles().then(async articles => {
  const markdownArticles = await getMarkdownArticles()
  markdownArticles.forEach(markdownArticle => {
    const article = articles.find(
      article => article.canonical_url === markdownArticle.canonical_url,
    )
    if (article) {
      updateArticle(article.id, markdownArticle)
    } else {
      postArticle(markdownArticle)
    }
  })
})
