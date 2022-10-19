import { defineNuxtModule, useNuxt } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'components-chunk',
  },
  setup () {
    const nuxt = useNuxt()
    let dirs: string[]

    nuxt.hook('components:dirs', _dirs => {
      dirs = _dirs.map(d => (typeof d === 'string' ? d : d.path))
    })

    const usedComponents = [
      'ContentRendererMarkdown',
      'ProseP',
      'ProseA',
      'ProseH3',
      'ProseLi',
      'ProseOl',
      'ProseUl',
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

    // Use single components chunk
    nuxt.hook('vite:extendConfig', (config, { isServer }) => {
      if (Array.isArray(config.build.rollupOptions.output) || isServer) return
      config.build.rollupOptions.output.manualChunks = id => {
        if (
          (id.includes('@nuxt/content') || id.includes('ProseImg')) &&
          dirs.some(dir => id.includes(dir))
        ) {
          return 'components-chunk'
        }
      }
    })
  },
})
