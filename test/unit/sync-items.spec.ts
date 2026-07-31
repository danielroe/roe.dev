import { describe, it, expect } from 'vitest'

import { contentCMS } from '../../content.config'

const posts = await contentCMS.list(['blog'])

describe('blog content parsing', () => {
  it('all blog posts have required frontmatter', () => {
    expect(posts.length).toBeGreaterThan(0)

    for (const { path, data } of posts) {
      expect(data.title, `${path} missing title`).toBeTruthy()
      expect(data.date, `${path} missing date`).toBeTruthy()
      expect(Array.isArray(data.tags), `${path} tags should be an array`).toBe(true)
    }
  })

  it('blog post dates are valid', () => {
    for (const { path, data } of posts) {
      const date = new Date(data.date as string)

      expect(date.toString(), `${path} has invalid date: ${data.date}`).not.toBe('Invalid Date')
    }
  })

  it('blog post slugs form valid paths', () => {
    for (const { path, meta } of posts) {
      const slug = meta.stem
      expect(slug, `${path} has no slug`).toBeTruthy()
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
