const blogs = require.context('@/content/articles/', true, /.md$/, 'lazy')

export const useBlogEntries = () => {
  const entries = blogs.keys().map(key => {
    const {
      attributes: { title, date },
    } = require(`@/content/articles/${key.slice(2)}?meta`)
    const slug = key.slice(2, -3)

    return { title, slug, date }
  })
  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  return {
    entries,
  }
}
