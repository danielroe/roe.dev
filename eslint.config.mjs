import { join } from 'pathe'
import withNuxt from './.nuxt/eslint.config.mjs'
import studio from '@sanity/eslint-config-studio'

export default withNuxt([
  {
    rules: {
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
    },
  },
  {
    files: ['*.config.js'],
    rules: {
      'no-undef': 'off',
    },
  },
]).append(
  // @ts-expect-error no types
  ...studio.map(config => ({
    ...config,
    files: config.files?.map(file => join('cms', file)) ?? ['cms/**/*'],
  })),
)
