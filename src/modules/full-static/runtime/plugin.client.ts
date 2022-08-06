import type { NuxtApp } from '#app'
import type { RouteLocationRaw } from 'vue-router'

type StaticData = Pick<NuxtApp['payload'], 'data' | 'state'>

export default defineNuxtPlugin(nuxtApp => {
  const router = useRouter()
  const resolve = (route: string | RouteLocationRaw) =>
    typeof route === 'string' ? route : router.resolve(route).path

  const s = {
    prefetched: new Set<string>(),
    prefetch: async (route: string | RouteLocationRaw) => {
      const path = resolve(route)

      if (!s.prefetched.has(path)) {
        const name = path === '/' ? '/index' : path
        const { data, state } = await $fetch<StaticData>(`${name}.json`)
        Object.assign(nuxtApp.payload.data, data)
        for (const item in state) {
          nuxtApp.payload.state[item] ??= state[item]
        }
      }
    },
  }

  return {
    provide: { static: s },
  }
})
