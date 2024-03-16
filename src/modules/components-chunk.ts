import { addPlugin, createResolver, defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'components-chunk',
  },
  setup () {
    const nuxt = useNuxt()

    const usedComponents = [
      'ContentRendererMarkdown',
      'ProseP',
      'ProseA',
      'ProseH2',
      'ProseH3',
      'ProseLi',
      'ProseEm',
      'ProseOl',
      'ProseUl',
      'ProsePre',
      'ProseStrong',
      'ProseBlockquote',
      'ProseThead',
      'ProseTable',
      'ProseTr',
      'ProseTd',
      'ProseTh',
      'ProseTbody',
      'ProseCode',
      'ProseCodeInline',
    ]

    // Exclude non-prose content components
    nuxt.hook('components:extend', components => {
      const toPurge = []
      for (const component of components) {
        if (
          'filePath' in component &&
          component.filePath.includes('@nuxt/content')
        ) {
          if (!usedComponents.includes(component.pascalName)) {
            toPurge.push(component)
          }
        }
      }
      for (const component of toPurge) {
        components.splice(components.indexOf(component), 1)
      }
    })

    nuxt.hook('build:manifest', manifest => {
      for (const file in manifest) {
        manifest[file].imports = manifest[file].imports?.filter(
          i => !i.includes('ContentRendererMarkdown')
        )
        manifest[file].dynamicImports = manifest[file].dynamicImports?.filter(
          i => !i.includes('ContentRendererMarkdown')
        )
      }
    })

    const { resolve } = createResolver(import.meta.url)
    addPlugin({
      src: resolve('./runtime/remove-renderer.server.ts'),
      mode: 'server',
    })
  },
})
