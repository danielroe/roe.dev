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
})
