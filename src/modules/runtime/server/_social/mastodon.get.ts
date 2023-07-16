import { createClient } from 'masto'
import { parseURL, withProtocol } from 'ufo'

export default defineLazyEventHandler(async () => {
  const acct = useRuntimeConfig().social.networks.mastodon.identifier

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
        .map(p => ({
          network: 'mastodon' as const,
          accountLink: `https://elk.zone/${host}/@${p.account.acct}`,
          avatar: p.account.avatar,
          handle: p.account.displayName.replace(
            /:([a-z-]+):/g,
            (string, shortcode) => {
              const emoji = p.account.emojis.find(
                e => e.shortcode === shortcode
              )
              if (!emoji) return string
              return `<img src="${emoji.url}" style="height:1em" alt="${shortcode} emoji" />`
            }
          ),
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
