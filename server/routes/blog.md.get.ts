import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(event => {
  const lines = [
    mdFrontmatter('/blog', pageMeta['/blog']!),
    '',
  ]

  for (const post of blogPosts()) {
    lines.push(blogListItem(post))
    if (post.data.description) {
      lines.push(`  ${post.data.description}`)
    }
  }

  lines.push('')

  return mdResponse(event, lines.join('\n'))
})
