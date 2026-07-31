export default defineEventHandler(event => {
  const url = getRequestURL(event)
  const match = url.pathname.match(/\/blog\/(.+)\.md$/)
  const slug = match?.[1]

  const post = slug
    ? blogPosts().find(p => p.meta.stem === slug)
    : undefined
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const { title, date, tags, description } = post.data

  const md = [
    mdFrontmatter(post.path, { title, description, date: isoDate(date), tags }),
    '',
    post.meta.markdown,
    '',
  ].join('\n')

  return mdResponse(event, md)
})
