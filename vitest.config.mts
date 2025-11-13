import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'test/unit',
      defineVitestProject({
        test: {
          name: 'nuxt',
          dir: 'test/nuxt',
          environmentOptions: {
            nuxt: {
              overrides: {
                ogImage: { enabled: false },
              },
            },
          },
        },
      }),
    ],
  },
})
