import type { ParsedReqs } from '../../open-graph/index'
import {
  parseReqs,
  getHtml,
  writeTempFile,
  getScreenshot,
} from '../../open-graph/index'

const isDev = process.env.VERCEL_ENV === 'development'

export default defineEventHandler(async event => {
  if (!process.dev && !process.env.prerender) return

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

  const file = await getScreenshot(fileUrl, isDev)

  setHeaders(event, {
    'Content-Type': 'image/jpeg',
    'Cache-Control':
      'public,immutable,no-transform,s-max-age=21600,max-age=21600',
  })
  return file
})
