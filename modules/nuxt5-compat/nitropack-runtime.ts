import { getRouteRules as getNitroRouteRules } from 'nitro/app'

import type { H3Event } from 'nitro/h3'
import type { NitroRouteRules } from 'nitro/types'

export { definePlugin as defineNitroPlugin } from 'nitro'
export { useNitroApp } from 'nitro/app'
export { useRuntimeConfig } from 'nitro/runtime-config'
export { useStorage } from 'nitro/storage'
export { runTask } from 'nitro/task'

/**
 * Nitro 2 exposed the merged route rules for a request as a flat object keyed
 * by rule name. Nitro 3 registers named rules and matches them by method and
 * pathname, returning `{ name, options, route, params }` entries, so flatten
 * back to the nitro 2 shape for modules still importing from
 * `nitropack/runtime`.
 */
export function getRouteRules (event: H3Event): Partial<NitroRouteRules> {
  const { routeRules } = getNitroRouteRules(event.req.method, event.url.pathname)
  const rules: Record<string, unknown> = {}
  for (const rule of Object.values(routeRules || {})) {
    rules[rule.name] = rule.options
  }
  return rules as Partial<NitroRouteRules>
}
