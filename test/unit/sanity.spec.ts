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

describe('mentions', () => {
  const testCases = {
    bluesky: '@nuxt.com',
    mastodon: '@nuxt@webtoo.ls',
    linkedin: 'nuxt',
  }

  it.each(Object.entries(testCases))('should extract mentions from a block - %s', async (network, handle) => {
    expect(resolveTextForPlatform(exampleBlocks, network as 'bluesky')).toEqual(`aJust doing a test of ${handle} on bluesky...? `)
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
