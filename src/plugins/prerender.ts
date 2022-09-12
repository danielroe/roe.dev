export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.ssrContext.payload.prerenderedAt = Date.now()
})
