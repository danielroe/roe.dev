const fs = require('fs')

module.exports = {
  port: process.env.PORT || '4000',
  template: fs.readFileSync('index.template.html', 'utf-8'),
  plugins: [
    require.resolve('./vapper-webpack.js'),
    [
      '@vapper/plugin-prerender',
      {
        routes: ['/', '/blog', '/blog/introduction'],
      },
    ],
  ],
}
