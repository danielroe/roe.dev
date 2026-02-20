import { rawPages } from '#md-raw-pages.json'
import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(() => {
  const md = [
    mdFrontmatter('/bio', pageMeta['/bio']!),
    '',
    rawPages['bio'] || '',
    '',
  ].join('\n')

  return mdResponse(md)
})
