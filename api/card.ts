import { IncomingMessage, ServerResponse } from 'http'
import { parseReqs, ParsedReqs } from './parser'
import { getHtml } from './template'
import { writeTempFile } from './file'
import { getScreenshot } from './chromium'

const isDev = process.env.NOW_REGION === 'dev1'

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    let parsedReqs: ParsedReqs
    try {
      parsedReqs = parseReqs(req)
    } catch (e) {
      res.setHeader(
        'Cache-Control',
        'public,immutable,no-transform,s-max-age=21600,max-age=21600',
      )
      res.statusCode = 404
      return res.end()
    }

    const html = getHtml(parsedReqs)

    const DEBUG = false

    if (!DEBUG) {
      const { title } = parsedReqs
      const fileName = title
      const filePath = await writeTempFile(fileName, html)
      const fileUrl = `file://${filePath}`

      const file = await getScreenshot(fileUrl, isDev)

      res.statusCode = 200
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader(
        'Cache-Control',
        'public,immutable,no-transform,s-max-age=21600,max-age=21600',
      )
      res.end(file)
    } else {
      res.setHeader('Content-Type', 'text/html')
      res.end(html)
    }
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/html')
    res.end('<h1>Internal Error</h1><p>Sorry, an error occurred.</p>')
    console.error(e)
  }
}
