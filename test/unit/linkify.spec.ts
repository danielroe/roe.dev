import { describe, it, expect } from 'vitest'

import { linkifyBareUrls } from '../../modules/social/runtime/server/_social/linkify'

describe('linkifyBareUrls', () => {
  it('wraps bare domain references with a link', () => {
    expect(linkifyBareUrls('<p>roe.dev/ama</p>')).toBe(
      '<p><a href="https://roe.dev/ama">roe.dev/ama</a></p>',
    )
  })

  it('leaves existing anchors untouched', () => {
    const input = '<p>see <a href="https://roe.dev/ama" class="mention">roe.dev/ama</a> for more</p>'
    expect(linkifyBareUrls(input)).toBe(input)
  })

  it('does not double-wrap content inside an anchor that also references another domain', () => {
    const input = '<p><a href="https://mastodon.roe.dev/tags/ama">roe.dev/ama</a> roe.dev/ama</p>'
    expect(linkifyBareUrls(input)).toBe(
      '<p><a href="https://mastodon.roe.dev/tags/ama">roe.dev/ama</a> <a href="https://roe.dev/ama">roe.dev/ama</a></p>',
    )
  })

  it('linkifies plain protocol URLs', () => {
    expect(linkifyBareUrls('visit https://example.com/foo!')).toBe(
      'visit <a href="https://example.com/foo">https://example.com/foo</a>!',
    )
  })

  it('keeps trailing punctuation outside the link', () => {
    expect(linkifyBareUrls('see roe.dev/ama.')).toBe(
      'see <a href="https://roe.dev/ama">roe.dev/ama</a>.',
    )
    expect(linkifyBareUrls('(see roe.dev/ama)')).toBe(
      '(see <a href="https://roe.dev/ama">roe.dev/ama</a>)',
    )
  })

  it('keeps balanced parentheses inside the link', () => {
    expect(linkifyBareUrls('see https://en.wikipedia.org/wiki/Foo_(bar) ok')).toBe(
      'see <a href="https://en.wikipedia.org/wiki/Foo_(bar)">https://en.wikipedia.org/wiki/Foo_(bar)</a> ok',
    )
  })

  it('leaves dotted prose like node.js or foo.bar alone (no path)', () => {
    expect(linkifyBareUrls('<p>node.js and foo.bar are fine</p>')).toBe(
      '<p>node.js and foo.bar are fine</p>',
    )
  })

  it('still linkifies www.-prefixed hosts even without a path', () => {
    expect(linkifyBareUrls('go to www.example.com today')).toBe(
      'go to <a href="https://www.example.com">www.example.com</a> today',
    )
  })

  it('does not break on empty input', () => {
    expect(linkifyBareUrls('')).toBe('')
  })

  it('handles the real-world mastodon post that triggered this', () => {
    const input = '<p>I&#39;ve always been interested in tech</p><p>roe.dev/ama</p><p><a href="https://mastodon.roe.dev/tags/ama" class="mention hashtag" rel="tag">#<span>ama</span></a></p>'
    expect(linkifyBareUrls(input)).toBe(
      '<p>I&#39;ve always been interested in tech</p><p><a href="https://roe.dev/ama">roe.dev/ama</a></p><p><a href="https://mastodon.roe.dev/tags/ama" class="mention hashtag" rel="tag">#<span>ama</span></a></p>',
    )
  })
})
