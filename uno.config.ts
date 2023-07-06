import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  shortcuts: [{ hidden: 'display-none' }],
  theme: {
    fontFamily: {
      sans: 'Barlow, "Barlow fallback", sans-serif',
      code: 'Fira Code',
      serif: 'Vollkorn, serif',
    },
  },
  presets: [
    presetUno({
      dark: {
        dark: 'dark-mode',
        light: 'light-mode',
      },
    }),
  ],
})
