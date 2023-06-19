import { getScreenshot } from '../../open-graph/index'

const isDev = process.env.VERCEL_ENV === 'development'

export default defineEventHandler(async event => {
  if (!process.dev && !process.env.prerender) return

  setHeaders(event, {
    'cache-control':
      'public,immutable,no-transform,s-maxage=21600,max-age=21600',
    'content-type': 'image/jpeg',
  })

  const website =
    (getQuery(event).website as string) ||
    (await useStorage().getItem(getRouterParam(event, 'slug')))
  if (!website || typeof website !== 'string')
    throw createError('Missing website query parameter')

  const file = await getScreenshot(website, isDev)

  return file
})
