import { defineVitestConfig } from 'nuxt-vitest/config'

export default defineVitestConfig({
  test: {
    dir: 'test/unit',
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        overrides: {
          test: true,
        },
      },
    },
  },
})
