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

  try {
    let parsedReqs: ParsedReqs
    try {
      parsedReqs = parseReqs(slug)
    } catch (e) {
      event.node.res.setHeader(
        'Cache-Control',
        'public,immutable,no-transform,s-max-age=21600,max-age=21600'
      )
      event.node.res.statusCode = 404
      return event.node.res.end()
    }

    const html = getHtml(parsedReqs)

    const DEBUG = false

    if (!DEBUG) {
      const { title } = parsedReqs
      const fileName = title
      const filePath = await writeTempFile(fileName, html)
      const fileUrl = `file://${filePath}`

      const file = await getScreenshot(fileUrl, isDev)

      event.node.res.statusCode = 200
      event.node.res.setHeader('Content-Type', 'image/jpeg')
      event.node.res.setHeader(
        'Cache-Control',
        'public,immutable,no-transform,s-max-age=21600,max-age=21600'
      )
      event.node.res.end(file)
    } else {
      event.node.res.setHeader('Content-Type', 'text/html')
      event.node.res.end(html)
    }
  } catch (e) {
    event.node.res.statusCode = 500
    event.node.res.setHeader('Content-Type', 'text/html')
    event.node.res.end(
      '<h1>Internal Error</h1><p>Sorry, an error occurred.</p>'
    )
    console.error(e)
  }
})
