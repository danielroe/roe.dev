import type { AsyncData, NuxtError, UseFetchOptions } from 'nuxt/app'

type KeysOf<T> = Array<T extends T ? (keyof T extends string ? keyof T : never) : never>

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
): AsyncData<T, NuxtError<unknown> | undefined>
export function useAdminFetch<T> (
  url: string,
  options?: UseFetchOptions<T, T, KeysOf<T>, undefined>,
): AsyncData<T | undefined, NuxtError<unknown> | undefined>
export function useAdminFetch<T> (
  url: string,
  options: UseFetchOptions<T> = {},
): AsyncData<T | undefined, NuxtError<unknown> | undefined> {
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

  return result
}
