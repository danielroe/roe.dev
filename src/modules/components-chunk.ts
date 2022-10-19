import { defineNuxtModule, useNuxt } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'components-chunk',
  },
  setup () {
    const nuxt = useNuxt()

    const usedComponents = ['ContentRendererMarkdown']

    // Exclude non-prose content components
    nuxt.hook('components:extend', components => {
      for (const component of components) {
        if (
          'filePath' in component &&
          component.filePath.includes('@nuxt/content')
        ) {
          if (!usedComponents.includes(component.pascalName)) {
            component.global = false
          }
        }
      }
    })
  },
})
