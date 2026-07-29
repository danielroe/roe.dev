import { createFetch } from 'ofetch'
import { fetch } from 'nitro'
// @ts-expect-error resolved by nitro at build time
import { baseURL } from '#internal/nuxt/paths'

export const $fetch = globalThis.$fetch ??= createFetch({
  fetch,
  defaults: { baseURL: baseURL() },
}) as unknown as typeof globalThis.$fetch
