const fs = require('fs')
module.exports = {
  port: process.env.PORT || '4000',
  template: fs.readFileSync('index.template.html', 'utf-8'),
  plugins: [
    [
      '@vapper/plugin-prerender',
      {
        routes: ['/', '/about', '/blog', '/blog/test'],
      },
    ],
  ],
}
