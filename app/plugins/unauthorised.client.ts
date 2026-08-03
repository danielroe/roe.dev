export default defineNuxtPlugin({
  enforce: 'pre',
  setup () {
    globalThis.$fetch = globalThis.$fetch.create({
      onResponseError ({ request, response }) {
        if (!isUnauthorised(response)) return

        const url = typeof request === 'string' ? request : request instanceof Request ? request.url : String(request)
        const path = new URL(url, window.location.origin).pathname

        if (path.startsWith('/api/admin/')) redirectToLogin()
        else if (path.startsWith('/api/')) useNuxtApp().$auth?.logout()
      },
    })
  },
})
