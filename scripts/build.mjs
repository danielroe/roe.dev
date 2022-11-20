import grayMatter from 'gray-matter'

import { iterateOnDirectory, writeFile } from '../scripts/global.mjs'

const metadata = {}

iterateOnDirectory('./src/content/blog', (path, contents) => {
  const slug = path.match(/\/[^/]*$/)?.[0].slice(1, -3)
  const { data } = grayMatter(contents)
  const date = new Date(data.date)
  metadata[slug] = {
    ...data,
    date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  }
})

writeFile(
  'Saving metadata.',
  './src/server/metadata.json',
  JSON.stringify({
    metadata,
  })
)
