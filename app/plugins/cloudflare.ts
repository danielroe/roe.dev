export default defineNuxtPlugin({
  enforce: 'pre',
  env: { islands: false },
  setup () {
    return
    if (import.meta.test || import.meta.dev) {
      return
    }
    useScriptCloudflareWebAnalytics({ token: 'b0739c798a544ff6b46336e7772ce6af' })
  },
})
