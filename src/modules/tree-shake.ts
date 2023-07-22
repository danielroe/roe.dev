import { addVitePlugin, defineNuxtModule, useNuxt } from '@nuxt/kit'
import { findStaticImports } from 'mlly'
import MagicString from 'magic-string'

export default defineNuxtModule({
  meta: {
    name: 'tree-shake',
  },
  setup() {
    const nuxt = useNuxt()
    addVitePlugin({
      name: 'tree-shake',
      transform(code, id) {
        if (nuxt.options.dev) return

        if (!code.includes('Transition') && !code.includes('KeepAlive')) return

        const s = new MagicString(code)
        const imports = findStaticImports(code)

        for (const i of imports) {
          if (i.specifier !== 'vue') continue
          const hasTransition = i.imports.includes('Transition')
          const hasKeepAlive = i.imports.includes('KeepAlive')
          if (hasTransition || hasKeepAlive) {
            s.replace(
              i.code,
              i.code.replace('Transition, ', '').replace('KeepAlive, ', '')
            )
          }
          if (hasTransition) s.prepend('const Transition = {};\n')
          if (hasKeepAlive) s.prepend('const KeepAlive = {};\n')
        }

        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: s.generateMap({ source: id, includeContent: true }),
          }
        }
      },
    })
  },
})
