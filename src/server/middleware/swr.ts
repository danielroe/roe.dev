import { defineMiddleware } from 'h3'
export default defineMiddleware((_req, res, next) => {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
  next()
})
