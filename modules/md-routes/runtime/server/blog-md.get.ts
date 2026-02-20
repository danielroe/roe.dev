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

  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const md = [
    '---',
    `title: "${esc(post.title)}"`,
    `date: ${post.date}`,
    tagStr,
    `description: "${esc(post.description)}"`,
    `url: https://roe.dev/blog/${post.slug}`,
    '---',
    '',
    post.body,
    '',
  ].join('\n')

  return mdResponse(md)
})
