export default defineNuxtPlugin(nuxtApp => {
  const router = useRouter()

  router.getRoutes().forEach(route => {
    router.addRoute({
      path: (route.path === '/' ? '/index' : route.path) + '.json',
      components: route.components,
    })
  })

  nuxtApp.hook('app:rendered', ctx => {
    if (ctx.ssrContext.url.endsWith('.json')) {
      const res = ctx.ssrContext.res
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: nuxtApp.payload.data,
          state: {
            ...nuxtApp.payload.state,
            '$scolor-mode': undefined,
            $serror: undefined,
          },
        })
      )
    } else {
      const url = ctx.ssrContext.url === '/' ? '/index' : ctx.ssrContext.url
      ctx.html.head.push(`<!-- <link rel="prefetch" href="${url}.json"> -->`)
    }
  })
})
