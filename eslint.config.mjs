import nuxt from './.nuxt/eslint.config.mjs'

export default [
  ...nuxt,
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
  {
    // TODO: fix upstream
    files: ['src/error.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
]
