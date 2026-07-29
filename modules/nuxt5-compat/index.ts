import { resolveModulePath } from 'exsolve'
import { createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'
import type { TSConfig } from 'pkg-types'

/**
 * Temporary workarounds for Nuxt 5 / Nitro 3 incompatibilities.
 */
export default defineNuxtModule({
  meta: {
    name: 'nuxt5-compat',
  },
  setup () {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)

    // avoid shadowing nitro's `#imports`
    nuxt.hook('nitro:config', config => {
      delete config.alias?.['#imports']

      // add back `$fetch` auto-import
      if (config.imports) {
        config.imports.presets ||= []
        config.imports.presets.push({
          from: resolver.resolve('./fetch'),
          imports: ['$fetch'],
        })
      }
    })

    const h3 = resolveModulePath('h3', { from: resolveModulePath('nitro/h3', { from: import.meta.url }) })
    const paths = {
      h3: [h3],
      nitro: [resolveModulePath('nitro', { from: import.meta.url })],
    }
    for (const key in paths) {
      paths[key as keyof typeof paths] = paths[key as keyof typeof paths].map(p => p.replace(/\.mjs$/, '.d.mts'))
    }
    for (const config of [nuxt.options.typescript.tsConfig, nuxt.options.typescript.nodeTsConfig, nuxt.options.typescript.sharedTsConfig, nuxt.options.nitro.typescript!.tsConfig as TSConfig]) {
      config.compilerOptions ||= {}
      config.compilerOptions.paths = { ...paths, ...config.compilerOptions.paths }
    }

    // `nuxt-og-image`, `nuxt-site-config` and `nuxt-security` still import
    // runtime utilities from `nitropack/runtime` (nitro 2). Inlining nitro 2's
    // runtime pulls in `#nitro-internal-virtual/*` specifiers that nitro 3
    // does not provide, so point them at nitro 3's equivalents instead.
    nuxt.options.alias['nitropack/runtime'] = resolver.resolve('./nitropack-runtime')

    // Those same modules still depend on h3 v1, so the server bundle ends up
    // with both majors and v1 utilities are handed v2 events (`getRequestHost`
    // reads `event.node.req`, which no longer exists). Redirect only their
    // imports: packages such as `ipx` genuinely use the v1 API and would break
    // if pointed at v2.
    const H3_V1_CONSUMER_RE = /node_modules[/\\](?:nuxt-site-config|nuxtseo-shared|nuxt-og-image|nuxt-security)[/\\]/
    nuxt.options.nitro.rollupConfig ||= {}
    nuxt.options.nitro.rollupConfig.plugins ||= []
    ;(nuxt.options.nitro.rollupConfig.plugins as unknown[]).push({
      name: 'nuxt5-compat:h3-v2',
      resolveId: {
        filter: { id: /^h3$/ },
        handler: (_id: string, importer?: string) =>
          importer && H3_V1_CONSUMER_RE.test(importer) ? h3 : null,
      },
    })
  },
})
