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
      try {
        auth.user = await $fetch('/api/user')
      }
      catch (err: any) {
        if (err.name !== 'FetchError') {
          auth.user = {}
        }
      }
      auth.status = auth.user.authenticated ? 'logged-in' : 'logged-out'
    },
    logout: () => {
      useCookie('token', { maxAge: -1 }).value = ''
      return auth.login()
    },
    status: ref<UserStatus>('pending'),
  })

  nuxtApp.hook('app:mounted', () => {
    if (useCookie('token').value) auth.login()
    else auth.status = 'logged-out'
  })

  return {
    provide: {
      auth,
    },
  }
})
