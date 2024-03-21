import withNuxt from './.nuxt/eslint.config.mjs'

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
])
