import { createClient } from 'masto'
import { parseURL, withProtocol } from 'ufo'

export default defineLazyEventHandler(async () => {
  const acct = 'daniel@roe.dev'

  const data = await $fetch<{ subject: string; aliases: string[] }>(
    '.well-known/webfinger',
    {
      baseURL: withProtocol(acct.split('@')[1], 'https://'),
      query: {
        resource: `acct:${acct}`,
      },
    }
  )
  const { host, protocol } = parseURL(data.aliases[0])

  const client = createClient({
    url: withProtocol(host!, protocol!),
    disableVersionCheck: true,
    disableDeprecatedWarning: true,
  })
  const { id } = await client.v1.accounts.lookup({ acct })

  return defineEventHandler(async () => {
    const posts = await client.v1.accounts.listStatuses(id)
    return Promise.all(
      posts
        .filter(p => p.content && !p.inReplyToId)
        // .slice(0, 1)
        .map(p => ({
          createdAt: p.createdAt,
          permalink: p.url?.replace('https://', 'https://elk.zone/') ?? p.uri,
          media: p.mediaAttachments.map(m => ({
            url: m.url,
            width: m.meta?.original?.width,
            height: m.meta?.original?.height,
            alt: m.description,
          })),
          html: p.content,
        }))
    )
  })
})
