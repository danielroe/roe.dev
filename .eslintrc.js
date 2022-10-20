module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended',
  ],
  plugins: ['prettier'],
  // add your custom rules here
  overrides: [
    {
      files: ['src/pages/**/*.{js,ts,vue}', 'src/layouts/**/*.{js,ts,vue}'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
  ],
  rules: {
    'no-console': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
  },
}
