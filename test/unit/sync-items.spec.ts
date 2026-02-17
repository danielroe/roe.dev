import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { describe, it, expect } from 'vitest'
import grayMatter from 'gray-matter'
import { filename } from 'pathe/utils'
import { glob } from 'tinyglobby'

describe('blog content parsing', () => {
  it('all blog posts have required frontmatter', async () => {
    const files = await glob('./content/blog/**/*.md', { cwd: process.cwd(), absolute: true })
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const raw = await readFile(file, 'utf-8')
      const { data } = grayMatter(raw)
      const slug = filename(file)

      expect(data.title, `${slug} missing title`).toBeTruthy()
      expect(data.date, `${slug} missing date`).toBeTruthy()
      expect(Array.isArray(data.tags), `${slug} tags should be an array`).toBe(true)
    }
  })

  it('blog post dates are valid', async () => {
    const files = await glob('./content/blog/**/*.md', { cwd: process.cwd(), absolute: true })

    for (const file of files) {
      const raw = await readFile(file, 'utf-8')
      const { data } = grayMatter(raw)
      const slug = filename(file)
      const date = new Date(data.date)

      expect(date.toString(), `${slug} has invalid date: ${data.date}`).not.toBe('Invalid Date')
    }
  })

  it('blog post slugs form valid paths', async () => {
    const files = await glob('./content/blog/**/*.md', { cwd: process.cwd(), absolute: true })

    for (const file of files) {
      const slug = filename(file)
      expect(slug, `${file} has no slug`).toBeTruthy()
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
