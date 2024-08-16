import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: 'test/unit',
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
  },
})
