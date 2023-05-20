import { parseReqs, ParsedReqs } from '../../utils/_parser'
import { getHtml } from '../../utils/_template'
import { writeTempFile } from '../../utils/_file'
import { getScreenshot } from '../../utils/_chromium'

const isDev = process.env.VERCEL_ENV === 'development'

export default defineEventHandler(async event => {
  if (!process.dev && !process.env.prerender) return

  const slug = getRouterParam(event, 'slug')?.replace(/\.jpg$/, '')

  try {
    let parsedReqs: ParsedReqs
    try {
      parsedReqs = parseReqs(slug)
    } catch (e) {
      event.res.setHeader(
        'Cache-Control',
        'public,immutable,no-transform,s-max-age=21600,max-age=21600'
      )
      event.res.statusCode = 404
      return event.res.end()
    }

    const html = getHtml(parsedReqs)

    const DEBUG = false

    if (!DEBUG) {
      const { title } = parsedReqs
      const fileName = title
      const filePath = await writeTempFile(fileName, html)
      const fileUrl = `file://${filePath}`

      const file = await getScreenshot(fileUrl, isDev)

      event.res.statusCode = 200
      event.res.setHeader('Content-Type', 'image/jpeg')
      event.res.setHeader(
        'Cache-Control',
        'public,immutable,no-transform,s-max-age=21600,max-age=21600'
      )
      event.res.end(file)
    } else {
      event.res.setHeader('Content-Type', 'text/html')
      event.res.end(html)
    }
  } catch (e) {
    event.res.statusCode = 500
    event.res.setHeader('Content-Type', 'text/html')
    event.res.end('<h1>Internal Error</h1><p>Sorry, an error occurred.</p>')
    console.error(e)
  }
})
