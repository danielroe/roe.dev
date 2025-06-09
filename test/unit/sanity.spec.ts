import { describe, it, expect } from 'vitest'
import { resolveTextForPlatform, resolveTextWithFacets } from '../../server/utils/sanity/blocks'

const exampleBlocks = [
  {
    _key: 'a74d6089d512',
    _type: 'block',
    children: [
      {
        _key: '188657ac89a4',
        _type: 'span',
        marks: [],
        text: 'aJust doing a test of ',
      },
      {
        _key: 'ba7086ebde07',
        _type: 'span',
        marks: [
          '3f1de5709297',
        ],
        text: 'nuxt',
      },
      {
        _key: '0b4d735844bb',
        _type: 'span',
        marks: [],
        text: ' on ',
      },
      {
        _key: '79bef2991c27',
        _type: 'span',
        marks: [
          '74c8f2f3224a',
        ],
        text: 'bluesky',
      },
      {
        _key: '54da3505f147',
        _type: 'span',
        marks: [],
        text: '...? ',
      },
    ],
    markDefs: [
      {
        _key: '3f1de5709297',
        _type: 'entityMention',
        entity: {
          _id: 'a9440768-7d7a-40a2-a2de-2cc102b8f808',
          name: 'Nuxt',
          socialHandles: {
            bluesky: 'nuxt.com',
            mastodon: 'nuxt@webtoo.ls',
          },
        },
      },
      {
        _key: '74c8f2f3224a',
        _type: 'link',
        href: 'https://bsky.app',
      },
    ],
    style: 'normal',
  },
]

const linkTestBlocks = [
  {
    _key: 'test-block',
    _type: 'block',
    children: [
      {
        _key: 'text-before',
        _type: 'span',
        marks: [],
        text: 'you can see the code on ',
      },
      {
        _key: 'link-span',
        _type: 'span',
        marks: ['link-mark'],
        text: 'my website',
      },
      {
        _key: 'text-after',
        _type: 'span',
        marks: [],
        text: ' ....and even make a PR if you have an idea of a better approach...',
      },
    ],
    markDefs: [
      {
        _key: 'link-mark',
        _type: 'link',
        href: 'https://github.com/danielroe/roe.dev/blob/main/server/api/question.ts',
      },
    ],
    style: 'normal',
  },
]

const emojiLinkTestBlocks = [
  {
    _key: 'emoji-block',
    _type: 'block',
    children: [
      {
        _key: 'text-with-emoji',
        _type: 'span',
        marks: [],
        text: 'it\'s not difficult to clean up the _very few_ messages I get that aren\'t genuine 🤷',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
  {
    _key: 'link-block',
    _type: 'block',
    children: [
      {
        _key: 'text-before-link',
        _type: 'span',
        marks: [],
        text: 'you can see the code on ',
      },
      {
        _key: 'link-text',
        _type: 'span',
        marks: ['link-key'],
        text: 'my website',
      },
      {
        _key: 'text-after-link',
        _type: 'span',
        marks: [],
        text: ' ....and even make a PR if you have an idea of a better approach...',
      },
    ],
    markDefs: [
      {
        _key: 'link-key',
        _type: 'link',
        href: 'https://github.com/danielroe/roe.dev/blob/main/server/api/question.ts',
      },
    ],
    style: 'normal',
  },
]

describe('mentions', () => {
  const testCases = {
    bluesky: '@nuxt.com',
    mastodon: '@nuxt@webtoo.ls',
    linkedin: 'nuxt',
  }

  it.each(Object.entries(testCases))('should extract mentions from a block - %s', async (network, handle) => {
    const expectedText = network === 'mastodon' || network === 'linkedin'
      ? `aJust doing a test of ${handle} on bluesky (https://bsky.app)...? `
      : `aJust doing a test of ${handle} on bluesky...? `
    expect(resolveTextForPlatform(exampleBlocks, network as 'bluesky')).toEqual(expectedText)
  })

  it('should process mentions with facets', async () => {
    expect(resolveTextWithFacets(exampleBlocks)).toMatchInlineSnapshot(`
      {
        "facets": [
          {
            "features": [
              {
                "$type": "app.bsky.richtext.facet#mention",
                "did": "nuxt.com",
              },
            ],
            "index": {
              "byteEnd": 31,
              "byteStart": 22,
            },
          },
          {
            "features": [
              {
                "$type": "app.bsky.richtext.facet#link",
                "uri": "https://bsky.app",
              },
            ],
            "index": {
              "byteEnd": 42,
              "byteStart": 35,
            },
          },
        ],
        "text": "aJust doing a test of @nuxt.com on bluesky...? ",
      }
    `)
  })

  it('should add facets for links and hashtags', async () => {
    expect(resolveTextWithFacets(exampleBlocks, `\n\nroe.dev/ama\n\n#ama`)).toMatchInlineSnapshot(`
      {
        "facets": [
          {
            "features": [
              {
                "$type": "app.bsky.richtext.facet#mention",
                "did": "nuxt.com",
              },
            ],
            "index": {
              "byteEnd": 31,
              "byteStart": 22,
            },
          },
          {
            "features": [
              {
                "$type": "app.bsky.richtext.facet#link",
                "uri": "https://bsky.app",
              },
            ],
            "index": {
              "byteEnd": 42,
              "byteStart": 35,
            },
          },
          {
            "features": [
              {
                "$type": "app.bsky.richtext.facet#link",
                "uri": "https://roe.dev/ama",
              },
            ],
            "index": {
              "byteEnd": 60,
              "byteStart": 49,
            },
          },
          {
            "features": [
              {
                "$type": "app.bsky.richtext.facet#tag",
                "tag": "ama",
              },
            ],
            "index": {
              "byteEnd": 66,
              "byteStart": 62,
            },
          },
        ],
        "text": "aJust doing a test of @nuxt.com on bluesky...? 

      roe.dev/ama

      #ama",
      }
    `)
  })
})

describe('link handling for different platforms', () => {
  it('should include URLs for mastodon and linkedin', () => {
    const mastodonText = resolveTextForPlatform(linkTestBlocks, 'mastodon')
    const linkedinText = resolveTextForPlatform(linkTestBlocks, 'linkedin')
    const blueskyText = resolveTextForPlatform(linkTestBlocks, 'bluesky')

    expect(mastodonText).toContain('my website (https://github.com/danielroe/roe.dev/blob/main/server/api/question.ts)')
    expect(linkedinText).toContain('my website (https://github.com/danielroe/roe.dev/blob/main/server/api/question.ts)')
    expect(blueskyText).toEqual('you can see the code on my website ....and even make a PR if you have an idea of a better approach...')
  })

  it('should generate correct facets for bluesky links', () => {
    const result = resolveTextWithFacets(linkTestBlocks)

    expect(result.text).toEqual('you can see the code on my website ....and even make a PR if you have an idea of a better approach...')
    expect(result.facets).toHaveLength(1)
    expect(result.facets[0]).toEqual({
      index: {
        byteStart: 24,
        byteEnd: 34,
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: 'https://github.com/danielroe/roe.dev/blob/main/server/api/question.ts',
      }],
    })
  })

  it('should handle emojis correctly in byte offset calculation', () => {
    const result = resolveTextWithFacets(emojiLinkTestBlocks)

    // The text should be: "it's not difficult to clean up the _very few_ messages I get that aren't genuine 🤷\n\nyou can see the code on my website ....and even make a PR if you have an idea of a better approach..."
    // The emoji 🤷 is 4 bytes in UTF-8
    // First block: "it's not difficult to clean up the _very few_ messages I get that aren't genuine 🤷" (83 bytes)
    // Then "\n\n" (2 bytes)
    // Second block starts at byte 85
    // "you can see the code on " (25 bytes)
    // Link "my website" should start at byte 85 + 25 = 110
    const expectedText = 'it\'s not difficult to clean up the _very few_ messages I get that aren\'t genuine 🤷\n\nyou can see the code on my website ....and even make a PR if you have an idea of a better approach...'

    expect(result.text).toEqual(expectedText)
    expect(result.facets).toHaveLength(1)

    // Calculate expected byte positions
    const firstBlockText = 'it\'s not difficult to clean up the _very few_ messages I get that aren\'t genuine 🤷'
    const firstBlockBytes = Buffer.byteLength(firstBlockText, 'utf8')
    const newlineBytes = Buffer.byteLength('\n\n', 'utf8')
    const beforeLinkText = 'you can see the code on '
    const beforeLinkBytes = Buffer.byteLength(beforeLinkText, 'utf8')
    const linkText = 'my website'
    const linkBytes = Buffer.byteLength(linkText, 'utf8')

    const expectedByteStart = firstBlockBytes + newlineBytes + beforeLinkBytes
    const expectedByteEnd = expectedByteStart + linkBytes

    expect(result.facets[0]).toEqual({
      index: {
        byteStart: expectedByteStart,
        byteEnd: expectedByteEnd,
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: 'https://github.com/danielroe/roe.dev/blob/main/server/api/question.ts',
      }],
    })
  })
})
