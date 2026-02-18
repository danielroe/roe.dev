import { rawBlogPosts } from '#md-raw-blog.json'

export default defineEventHandler(event => {
  const url = getRequestURL(event)
  const match = url.pathname.match(/\/blog\/(.+)\.md$/)
  const slug = match?.[1]

  const post = slug ? rawBlogPosts.find(p => p.slug === slug) : undefined
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const tagStr = post.tags.length
    ? `tags: [${post.tags.join(', ')}]`
    : 'tags: []'

  const md = [
    '---',
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `date: ${post.date}`,
    tagStr,
    `description: "${post.description.replace(/"/g, '\\"')}"`,
    `url: https://roe.dev/blog/${post.slug}`,
    '---',
    '',
    mdInternalLinks(post.body.trim()),
    '',
  ].join('\n')

  return mdResponse(md)
})
