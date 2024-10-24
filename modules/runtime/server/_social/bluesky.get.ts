import BskyAPI from '@atproto/api'
import MagicString from 'magic-string'

const { BskyAgent } = BskyAPI as unknown as typeof import('@atproto/api')

interface PostRecord {
  $type: 'app.bsky.feed.post'
  createdAt: string
  facets: {
    features: Array<
      | {
        $type: 'app.bsky.richtext.facet#link'
        uri: string
      }
      | {
        $type: 'app.bsky.richtext.facet#mention'
        did: string
      }
    >
    index: {
      byteEnd: number
      byteStart: number
    }
  }[]
  embed?: {
    $type: 'app.bsky.embed.images'
    images: {
      alt: string
      image: {
        $type: 'blob'
        mimeType: 'image/jpeg'
        ref: {
          $link: string
        }
        size: number
      }
    }[]
  }
  text: string
}

interface PostEmbed {
  $type: 'app.bsky.embed.images#view'
  images: {
    alt: string
    fullsize: string
    thumb: string
  }[]
}

export default defineLazyEventHandler(async () => {
  const { identifier, password } = useRuntimeConfig().social.networks.bluesky
  const agent = new BskyAgent({ service: 'https://bsky.social' })

  await agent.login({
    identifier,
    password,
  })

  return defineEventHandler(async () => {
    const posts = await agent.getAuthorFeed({ actor: identifier })
    return Promise.all(
      posts.data.feed
        .filter(
          p =>
            '$type' in p.post.record
            && p.post.record.$type === 'app.bsky.feed.post'
            && p.post.author.handle === identifier
            && p.post.embed?.$type !== 'app.bsky.embed.record#view'
            && !p.reply,
        )
        .map(p => {
          const post = p.post.record as PostRecord
          const embed = p.post.embed as PostEmbed | undefined
          const text = new MagicString(post.text)
          for (const facet of post.facets || []) {
            const startIndex = [...post.text].findIndex(
              (_, i) =>
                Buffer.byteLength(post.text.slice(0, i + 1))
                > facet.index.byteStart,
            )
            const endIndex = [...post.text].findIndex(
              (_, i) =>
                Buffer.byteLength(post.text.slice(0, i + 1))
                >= facet.index.byteEnd,
            )
            for (const feature of facet.features) {
              if (feature.$type === 'app.bsky.richtext.facet#link') {
                text.appendRight(startIndex, `<a href="${feature.uri}">`)
                text.appendLeft(endIndex === -1 ? post.text.length : endIndex + 1, '</a>')
                continue
              }
            }
          }

          text.replaceAll(/[<>&]/g, r => ({
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
          }[r]!))

          for (const match of post.text.matchAll(/\n\n/g)) {
            text.overwrite(match.index!, match.index! + 2, '</p><p>')
          }

          text.prepend('<p>')
          text.append('</p>')

          return {
            network: 'bluesky' as const,
            accountLink: `https://staging.bsky.app/profile/${p.post.author.handle}`,
            avatar: p.post.author.avatar,
            handle: p.post.author.displayName,
            createdAt: post.createdAt,
            permalink:
              `https://staging.bsky.app/profile/${p.post.author.handle}/post`
              + p.post.uri.match(/(\/[^/]+)$/)?.[1],
            html: text.toString().replace(/\n/g, '<br>'),
            media: embed?.images?.map(i => ({
              url: i.fullsize,
              alt: i.alt,
            })),
          }
        }),
    )
  })
})
