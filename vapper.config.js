const fs = require('fs')

const { iterateOnDirectory, getMatchOrReturn } = require('./src/utils/global')

const routes = []

iterateOnDirectory('./src/content/articles', path => {
  const slug = getMatchOrReturn(path, /\/[^/]*$/, 0).slice(1, -3)
  routes.push(`/blog/${slug}`)
})

module.exports = {
  port: process.env.PORT || '4000',
  template: fs.readFileSync('index.template.html', 'utf-8'),
  plugins: [
    require.resolve('./vapper-webpack.js'),
    [
      '@vapper/plugin-prerender',
      {
        routes: ['/', '/work', '/blog', ...routes],
      },
    ],
  ],
}
