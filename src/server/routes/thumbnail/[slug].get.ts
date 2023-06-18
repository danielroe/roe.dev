import { getScreenshot } from '../../open-graph/index'

const isDev = process.env.VERCEL_ENV === 'development'

const cache: Record<string, any> = {}

export default defineEventHandler(async event => {
  if (!process.dev && !process.env.prerender) return

  setHeaders(event, {
    'cache-control':
      'public,immutable,no-transform,s-maxage=21600,max-age=21600',
    'content-type': 'image/jpeg',
  })

  if (cache[event.path]) return cache[event.path]

  const website = getQuery(event).website as string
  if (!website || typeof website !== 'string')
    throw createError('Missing website query parameter')

  const file = await getScreenshot(website, isDev)
  cache[event.path.replace(/\?.*$/, '')] = file

  return file
})
