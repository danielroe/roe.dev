import { getScreenshot } from '../../open-graph/index'

export default defineEventHandler(async event => {
  if (!import.meta.dev && !import.meta.prerender) return

  const website =
    (getQuery(event).website as string) ||
    (await useStorage().getItem(getRouterParam(event, 'slug')!))
  if (!website || typeof website !== 'string')
    throw createError('Missing website query parameter')

  const file = await getScreenshot(website, import.meta.dev)

  event.node.res.statusCode = 200
  event.node.res.setHeader('Content-Type', 'image/jpeg')
  event.node.res.setHeader(
    'Cache-Control',
    'public,immutable,no-transform,s-max-age=21600,max-age=21600'
  )
  event.node.res.end(file)
})
