export { definePlugin as defineNitroPlugin } from 'nitro'
export { useNitroApp } from 'nitro/app'
export { useRuntimeConfig } from 'nitro/runtime-config'
export { useStorage } from 'nitro/storage'
export { runTask } from 'nitro/task'

/**
 * Nitro 2 exposed the merged route rules for a request as a flat object. Nitro
 * 3 replaced this with named, registered rules and a different signature
 * (`getRouteRules(method, pathname)`), so there is nothing faithful to map
 * onto. Nothing in this app sets module-specific route rules, so return an
 * empty object rather than guessing.
 */
export function getRouteRules (): Record<string, unknown> {
  return {}
}
