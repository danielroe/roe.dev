import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: 'test/unit',
    environment: 'nuxt',
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
  },
})
