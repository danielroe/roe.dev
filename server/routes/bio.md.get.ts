import { rawPages } from '#md-raw-pages.json'
import { pageMeta } from '#md-page-meta.json'

export default defineEventHandler(() => {
  const body = rawPages['bio'] || ''

  const md = [
    mdFrontmatter('/bio', pageMeta['/bio']!),
    '',
    mdInternalLinks(mdCleanHtml(body)),
    '',
  ].join('\n')

  return mdResponse(md)
})
