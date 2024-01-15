import type { ParsedReqs } from '../../open-graph/index'
import {
  parseReqs,
  getHtml,
  writeTempFile,
  getScreenshot,
} from '../../open-graph/index'

export default defineEventHandler(async event => {
  if (!import.meta.dev && !import.meta.prerender) return

  const slug = getRouterParam(event, 'slug')!.replace(/\.jpg$/, '')

  let parsedReqs: ParsedReqs
  try {
    parsedReqs = parseReqs(slug)
  } catch (e) {
    setHeader(
      event,
      'Cache-Control',
      'public,immutable,no-transform,s-max-age=21600,max-age=21600'
    )
    setResponseStatus(event, 404)
    return
  }

  const html = getHtml(parsedReqs)

  const filePath = await writeTempFile(parsedReqs.title, html)
  const fileUrl = `file://${filePath}`

  const file = await getScreenshot(fileUrl, import.meta.dev)

  // @ts-expect-error bug in h3 - https://github.com/unjs/h3/issues/614
  setHeaders(event, {
    'Content-Type': 'image/jpeg',
    'Cache-Control':
      'public,immutable,no-transform,s-max-age=21600,max-age=21600',
  })
  return file
})
