const shiki = require('shiki')
const Mode = require('frontmatter-markdown-loader/mode')
const markdown = require('markdown-it')

let highlighter
shiki
  .getHighlighter({
    theme: 'Material-Theme-Palenight',
  })
  .then(hl => {
    highlighter = hl
  })
const md = markdown({
  html: true,
  highlight: (code, lang) => {
    return highlighter.codeToHtml(code, lang)
  },
})

module.exports = {
  pluginOptions: {
    autoRouting: {
      chunkNamePrefix: 'page-',
    },
  },
  css: {
    extract: true,
    sourceMap: true,
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.md$/,
          oneOf: [
            {
              resourceQuery: /meta/,
              loader: 'frontmatter-markdown-loader',
              options: {
                mode: [Mode.HTML],
              },
              // use: [
              //   {
              //   },
              // ],
            },
            {
              loader: 'frontmatter-markdown-loader',
              options: {
                mode: [Mode.VUE_COMPONENT],
                markdownIt: md,
                root: 'article',
              },
            },
          ],
        },
        // {
        //   test: /\.md$/,
        // },
        // {
        //   test: /.mdx?$/,
        //   use: ['babel-loader', '@mdx-js/vue-loader'],
        // },
      ],
    },
  },
}
