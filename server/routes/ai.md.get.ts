import { rawPages } from '#md-raw-pages.json'
import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(() => {
  const md = [
    mdFrontmatter('/ai', pageMeta['/ai']!),
    '',
    rawPages['ai'] || '',
    '',
  ].join('\n')

  return mdResponse(md)
})
