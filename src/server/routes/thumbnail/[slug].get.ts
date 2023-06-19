import { getScreenshot } from '../../open-graph/index'

const isDev = process.env.VERCEL_ENV === 'development'

export default defineEventHandler(async event => {
  if (!process.dev && !process.env.prerender) return

  const website =
    (getQuery(event).website as string) ||
    (await useStorage().getItem(getRouterParam(event, 'slug')))
  if (!website || typeof website !== 'string')
    throw createError('Missing website query parameter')

  const file = await getScreenshot(website, isDev)

  event.node.res.statusCode = 200
  event.node.res.setHeader('Content-Type', 'image/jpeg')
  event.node.res.setHeader(
    'Cache-Control',
    'public,immutable,no-transform,s-max-age=21600,max-age=21600'
  )
  event.node.res.end(file)
})
