export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('app:suspense:resolve', () => {
    requestIdleCallback(() => {
      prefetchComponents(['ContentRendererMarkdown'])
    })
  })
})
