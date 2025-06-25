import { syncWithProvider } from '../providers/index'
import { getMarkdownArticles, getTalks } from '../utils/items'

export default defineTask({
  meta: {
    name: 'sync',
    description: 'Sync blogs and talks to GitHub Stars API and dev.to',
  },
  async run () {
    const items = [
      ...await getMarkdownArticles(),
      ...await getTalks(),
    ]
    const result = await Promise.all([
      syncWithProvider('github-stars', items),
      syncWithProvider('dev-to', items),
    ])
    return { result }
  },
})
