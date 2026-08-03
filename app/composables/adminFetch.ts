import type { AsyncData, NuxtError, UseFetchOptions } from 'nuxt/app'
import type { ComputedRef } from 'vue'

type KeysOf<T> = Array<T extends T ? (keyof T extends string ? keyof T : never) : never>

/**
 * `status` is `idle` during SSR (the request is client-only) and flips to
 * `pending` as soon as the client picks it up, which would make any
 * `status === 'pending'` template branch mismatch on hydration. `loading`
 * covers both so server and client agree on the first render.
 */
type AdminAsyncData<T> = AsyncData<T, NuxtError<unknown> | undefined> & { loading: ComputedRef<boolean> }

const cache = new Map<string, unknown>()

/**
 * `useFetch` wrapper for the /admin surface. Requests are client-only
 * (`server: false`): the admin session lives in an httpOnly cookie the
 * browser holds, which a server-side render does not forward to
 * `/api/admin/*`, so an SSR'd request 401s and hydrates as empty state.
 * Navigation is never blocked (`lazy: true`), and successful responses are
 * cached client-side for the lifetime of the app so returning to a page renders instantly from cache.
 * A cache hit still triggers a background refresh once the app is idle, so
 * stale data heals itself without blocking the UI.
 */
export function useAdminFetch<T> (
  url: string,
  options: UseFetchOptions<T, T, KeysOf<T>, T> & { default: () => T },
): AdminAsyncData<T>
export function useAdminFetch<T> (
  url: string,
  options?: UseFetchOptions<T, T, KeysOf<T>, undefined>,
): AdminAsyncData<T | undefined>
export function useAdminFetch<T> (
  url: string,
  options: UseFetchOptions<T> = {},
): AdminAsyncData<T | undefined> {
  const key = `admin:${url}`
  const hasCached = import.meta.client && cache.has(key)

  const result = useFetch(url, {
    key,
    lazy: true,
    server: false,
    getCachedData: () => (import.meta.client ? cache.get(key) as T | undefined : undefined),
    ...options,
  } as UseFetchOptions<T>) as AsyncData<T | undefined, NuxtError<unknown> | undefined>

  if (import.meta.client) {
    watch([result.data, result.status], ([value, status]) => {
      if (status === 'success') cache.set(key, value)
    }, { immediate: true })

    watch(result.error, error => {
      if (isUnauthorised(error)) redirectToLogin()
    }, { immediate: true })

    if (hasCached) {
      onNuxtReady(() => result.refresh())
    }
  }

  return Object.assign(result, {
    loading: computed(() => result.status.value === 'idle' || result.status.value === 'pending'),
  })
}
