const blogs = require.context('../pages/blog/articles/', true, /.md$/, 'lazy')

export const useBlogEntries = () => {
  const entries = blogs.keys().map(key => {
    const {
      attributes: { title, date },
    } = require(`../pages/blog/articles/${key.slice(2)}?meta`)
    const slug = key.slice(2, -3)

    return { title, slug, date }
  })
  return {
    entries,
  }
}
