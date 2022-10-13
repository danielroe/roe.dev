type UserStatus = 'pending' | 'logged-in' | 'logged-out'
type User = {
  avatar?: string
  name?: string
  sponsor?: boolean
  authenticated?: boolean
}

export default defineNuxtPlugin(nuxtApp => {
  const auth = reactive({
    user: {} as User,
    login: async () => {
      auth.user = await $fetch('/api/user').catch(() => ({}))
      auth.status = auth.user.authenticated ? 'logged-in' : 'logged-out'
    },
    logout: () => {
      useCookie('token', { maxAge: -1 }).value = null
      return auth.login()
    },
    status: ref<UserStatus>('pending'),
  })

  nuxtApp.hook('app:mounted', auth.login)

  return {
    provide: {
      auth,
    },
  }
})
