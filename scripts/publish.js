const axios = require('axios')
const fs = require('fs')
const path = require('path')

const url = 'https://dev.to/api'
const token = process.env.DEVTO_TOKEN || 'CYgR6zbcVgtKDRkawFYZKrCT'

/**
 * @type {(dir: string, callback: (path: string) => any)} walkDir
 */
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f)
    const isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f))
  })
}

/**
 * @type {(directory: string, callback: (path: string, contents: string) => any)} iterateOnDirectory
 */
function iterateOnDirectory(directory, callback) {
  walkDir(path.resolve(__dirname, directory), path =>
    callback(path, fs.existsSync(path) && fs.readFileSync(path, 'utf8')),
  )
}

/**
 * @type {(haystack: string, needle: string | RegExp, index: number ) => string} getMatchOrReturn
 */
function getMatchOrReturn(haystack, needle, index = 0) {
  const matches = haystack.match(needle)
  if (!matches || !matches.length || matches.length < index + 1) return ''
  return matches[index]
}

async function getMarkdownArticles() {
  const articles = []
  iterateOnDirectory('../src/pages/blog', (path, contents) => {
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
  //   console.log('TCL: articles', articles)
  const markdownArticles = await getMarkdownArticles()
  //   console.log('TCL: markdownArticles', markdownArticles)
  markdownArticles.forEach(markdownArticle => {
    const article = articles.find(
      article => article.canonical_url === markdownArticle.canonical_url,
    )
    // console.log('TCL: article', article)
    if (article) {
      updateArticle(article.id, markdownArticle)
    } else {
      postArticle(markdownArticle)
    }
  })
})

// console.log(getArticles())

// ARTICLES=$()

// ARTICLE=$(cat ../src/pages)

// curl --silent --show-error --fail \
//     -X POST "${API_URL}/articles" \
//     -H "api-key: ${DEVTO_TOKEN}" \
//     -H "Content-Type: text/json; charset=utf-8" \
//     -d @- <<EOF
// {
//     "article": {
//         "body_markdown": "${ARTICLE}"
//     }
// }
// EOF
