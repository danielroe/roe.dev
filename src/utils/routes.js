const { iterateOnDirectory, getMatchOrReturn } = require('./global')

function getRoutes() {
  const routes = []
  iterateOnDirectory('./src/pages', path => {
    if (!/\.vue$/.test(path)) return
    const slug = getMatchOrReturn(path, /\/[^/]*$/, 0).slice(1, -4)
    const dir = getMatchOrReturn(path, /pages\/(.*)\/.[^/]*$/, 1)

    const normalizedSlug = slug.replace('index', '').replace(/_(.*)/, ':$1?')
    routes.push({
      path: normalizedSlug ? `${dir}/${normalizedSlug}` : dir,
      name: dir ? `${dir.replace(/\//g, '-')}-${slug.replace('_', '')}` : slug,
      component: dir
        ? () => import(`@/pages/${dir}/${slug}.vue`)
        : () => import(`@/pages/${slug}.vue`),
    })
  })
  routes.sort(
    (a, b) => Number(a.path.includes(':')) - Number(b.path.includes(':')),
  )
  return routes
}

module.exports = {
  getRoutes,
}
