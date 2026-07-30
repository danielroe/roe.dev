import { definePlugin } from 'nitro'

import { $fetch } from './fetch'

/**
 * Nitro 2 attached a request-scoped `$fetch` to every h3 event; nitro 3 does
 * not. `nuxt-og-image` calls `event.$fetch()` to render island components, so
 * restore the property for modules still written against nitro 2.
 */
export default definePlugin(nitro => {
  nitro.hooks.hook('request', event => {
    const e = event as typeof event & { $fetch?: typeof $fetch }
    e.$fetch ??= $fetch
  })
})
