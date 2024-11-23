export default defineNuxtPlugin({
  order: -50,
  setup: () => { useScriptCloudflareWebAnalytics({ token: 'b0739c798a544ff6b46336e7772ce6af' }) },
})
