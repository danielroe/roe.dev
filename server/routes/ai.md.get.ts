import { rawPages } from '#md-raw-pages.json'
import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(() => {
  const body = rawPages['ai'] || ''

  const md = [
    mdFrontmatter('/ai', pageMeta['/ai']!),
    '',
    mdInternalLinks(mdCleanHtml(body)),
    '',
  ].join('\n')

  return mdResponse(md)
})
