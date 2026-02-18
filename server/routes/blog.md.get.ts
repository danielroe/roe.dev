import { rawBlogPosts } from '#md-raw-blog.json'
import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(() => {
  const lines = [
    mdFrontmatter('/blog', pageMeta['/blog']!),
    '',
  ]

  for (const post of rawBlogPosts) {
    lines.push(`- [${post.title}](https://roe.dev/blog/${post.slug}.md) — ${post.date}`)
    if (post.description) {
      lines.push(`  ${post.description}`)
    }
  }

  lines.push('')

  return mdResponse(lines.join('\n'))
})
