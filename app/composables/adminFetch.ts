import type { AsyncData, NuxtError, UseFetchOptions } from 'nuxt/app'

type KeysOf<T> = Array<T extends T ? (keyof T extends string ? keyof T : never) : never>

const cache = new Map<string, unknown>()

/**
 * `useFetch` wrapper for the /admin surface. Navigation is never blocked
 * (`lazy: true`), and successful responses are cached client-side for the
 * lifetime of the app so returning to a page renders instantly from cache.
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
    getCachedData: () => (import.meta.client ? cache.get(key) as T | undefined : undefined),
    ...options,
  } as UseFetchOptions<T>) as AsyncData<T | undefined, NuxtError<unknown> | undefined>

  if (import.meta.client) {
    watch([result.data, result.status], ([value, status]) => {
      if (status === 'success') cache.set(key, value)
    }, { immediate: true })

    if (hasCached) {
      onNuxtReady(() => result.refresh())
    }
  }

  return result
}
