export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    ssrContext!.modules = new Set(
      [...ssrContext!.modules!].filter(
        i => !i.includes('ContentRendererMarkdown')
      )
    )
  })
})
