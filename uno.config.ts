import { defineConfig, presetUno, presetIcons } from 'unocss'

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
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetUno({
      dark: {
        dark: 'dark-mode',
        light: 'light-mode',
      },
    }),
  ],
})
