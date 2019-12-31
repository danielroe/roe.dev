const IN_PRODUCTION = process.env.NODE_ENV === 'production'

module.exports = {
  plugins: IN_PRODUCTION
    ? []
    : [
        require('postcss-preset-env')({ stage: 0 }),
        require('postcss-nested')({}),
        require('tailwindcss')(),
        require('autoprefixer')(),
      ],
}
