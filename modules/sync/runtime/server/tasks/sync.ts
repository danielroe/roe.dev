// @ts-expect-error virtual file
import { syncArticles } from '#sync-articles.json'
import { providerNames, syncWithProvider } from '../providers/index'
import { getTalks } from '../utils/items'

export default defineTask({
  meta: {
    name: 'sync',
    description: 'Sync blogs and talks to GitHub Stars API and dev.to',
  },
  async run () {
    const items = [
      ...syncArticles,
      ...await getTalks(),
    ]
    const result = await Promise.all(providerNames.map(p => syncWithProvider(p, items)))
    return { result }
  },
})
