export default defineNuxtPlugin({
  enforce: 'pre',
  env: { islands: false },
  setup () {
    useScriptCloudflareWebAnalytics({ token: 'b0739c798a544ff6b46336e7772ce6af' })
  },
})
