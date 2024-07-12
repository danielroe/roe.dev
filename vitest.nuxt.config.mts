import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: 'test/nuxt',
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        overrides: {
          ogImage: { enabled: false },
        },
      },
    },
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
  },
})
