import type { SessionUser } from '#shared/types/api'

type UserStatus = 'pending' | 'logged-in' | 'logged-out'

export default defineNuxtPlugin(nuxtApp => {
  const auth = reactive({
    user: {} as Partial<SessionUser>,
    login: async () => {
      try {
        auth.user = await apiFetch('/api/user')
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

  nuxtApp.hook('app:suspense:resolve', () => {
    if (useCookie('token').value) auth.login()
    else auth.status = 'logged-out'
  })

  return {
    provide: {
      auth,
    },
  }
})
