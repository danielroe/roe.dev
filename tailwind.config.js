module.exports = {
  theme: {
    fontFamily: {
      sans: ['Barlow', 'sans-serif'],
      code: ['Fira Code'],
      serif: ['Vollkorn', 'serif'],
    },
    extend: {
      inset: {
        full: '100%',
      },
      opacity: {
        10: '0.1',
        90: '0.9',
      },
    },
  },
  corePlugins: {
    container: false,
  },
  purge: {
    enabled: false,
  },
}
