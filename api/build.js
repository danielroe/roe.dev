const grayMatter = require('gray-matter')

const {
  iterateOnDirectory,
  getMatchOrReturn,
  writeFile,
} = require('../scripts/global')

const metadata = {}

iterateOnDirectory('../src/content/articles', (path, contents) => {
  const slug = getMatchOrReturn(path, /\/[^/]*$/, 0).slice(1, -3)
  const { data } = grayMatter(contents)
  const date = new Date(data.date)
  metadata[slug] = {
    ...data,
    date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  }
})

console.log(metadata)

writeFile(
  'Saving metadata.',
  './metadata.json',
  JSON.stringify({
    metadata,
  })
)
