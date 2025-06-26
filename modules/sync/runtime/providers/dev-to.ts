import type { SyncItem, SyncProvider } from './index'

export class DevToProvider implements SyncProvider {
  name = 'dev-to'

  async sync (items: SyncItem[]): Promise<{ status: string, count: number, total: number }> {
    const token = useRuntimeConfig().devToToken
    if (!token) throw new Error('No NUXT_DEV_TO_TOKEN provided.')

    const $devto = $fetch.create({
      baseURL: 'https://dev.to/api',
      headers: { 'api-key': token },
    })

    // Fetch published articles
    const publishedArticles = await $devto<Array<{ id: string, canonical_url: string, title: string, body_markdown: string, tag_list?: string[] }>>('articles/me')

    let updated = 0
    for (const item of items) {
      if (item.type !== 'blog') {
        continue
      }
      const tags = (item.tags || [])
        .map(t => t.replace(/[^a-z0-9-]/g, ''))
        .filter(Boolean)
        .slice(0, 4)

      const article = publishedArticles.find(a => a.canonical_url === item.canonical_url)
      if (article) {
        if (
          item.body_markdown === article.body_markdown
          && item.title === article.title
          && item.canonical_url === article.canonical_url
          && JSON.stringify(tags.sort()) === JSON.stringify((article.tag_list || []).sort())
        ) {
          continue
        }
        console.info(`Updating article: ${item.title}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await $devto(`articles/${article.id}`, {
          method: 'PUT',
          body: {
            article: {
              published: true,
              title: item.title,
              body_markdown: item.body_markdown,
              canonical_url: item.canonical_url,
              tags,
            },
          },
        }).catch(console.error)
        updated++
        continue
      }

      console.info(`Publishing new article: ${item.title}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      await $devto('articles', {
        method: 'POST',
        body: {
          article: {
            published: true,
            title: item.title,
            canonical_url: item.canonical_url,
            body_markdown: item.body_markdown,
            tags,
          },
        },
      })
      updated++
    }
    return { status: 'done', count: updated, total: items.length }
  }
}
