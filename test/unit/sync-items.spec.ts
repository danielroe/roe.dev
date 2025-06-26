import fsp from 'node:fs/promises'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { getMarkdownArticles, getTalks } from '../../modules/sync/runtime/utils/items'

describe('getMarkdownArticles', () => {
  it('parses markdown frontmatter and content correctly', async () => {
    // Create a temporary markdown file with frontmatter
    const filePath = join(process.cwd(), 'content/blog/test-article.md')
    const markdown = `---\ntitle: Test Article\ndate: 2025-06-26\ntags: ["foo", "bar"]\n---\n\nThis is the first paragraph.\n\nSecond paragraph.`
    await fsp.mkdir(join(process.cwd(), 'content/blog'), { recursive: true })
    await fsp.writeFile(filePath, markdown)
    const articles = await getMarkdownArticles()
    const testArticle = articles.find(a => a.title === 'Test Article')
    expect(testArticle).toBeDefined()
    expect(testArticle?.tags).toEqual(['foo', 'bar'])
    expect(testArticle?.description).toContain('This is the first paragraph')
    expect(testArticle?.date).toBe('2025-06-26')
    // Cleanup
    await fsp.unlink(filePath)
  })

  it('parses titles and dates with quotes', async () => {
    const filePath = join(process.cwd(), 'content/blog/test-article-quotes.md')
    const markdown = `---\ntitle: "A 'Quoted' Title"\ndate: '2025-07-01'\ntags: ["foo"]\n---\n\nContent with quotes.`
    await fsp.mkdir(join(process.cwd(), 'content/blog'), { recursive: true })
    await fsp.writeFile(filePath, markdown)
    const articles = await getMarkdownArticles()
    const testArticle = articles.find(a => a.title === 'A \'Quoted\' Title')
    expect(testArticle).toBeDefined()
    expect(testArticle?.date).toBe('2025-07-01')
    expect(testArticle?.tags).toEqual(['foo'])
    // Cleanup
    await fsp.unlink(filePath)
  })

  it('parses tags as YAML array', async () => {
    const filePath = join(process.cwd(), 'content/blog/test-article-yaml-array.md')
    const markdown = `---\ntitle: YAML Array Tags\ndate: 2025-08-01\ntags:\n  - personal\n  - ux\n  - brand\n---\n\nYAML array tags test.`
    await fsp.mkdir(join(process.cwd(), 'content/blog'), { recursive: true })
    await fsp.writeFile(filePath, markdown)
    const articles = await getMarkdownArticles()
    const testArticle = articles.find(a => a.title === 'YAML Array Tags')
    expect(testArticle).toBeDefined()
    expect(testArticle?.tags).toEqual(['personal', 'ux', 'brand'])
    // Cleanup
    await fsp.unlink(filePath)
  })
})

describe('getTalks', () => {
  it('returns talks with correct fields and tags', async () => {
    const items = await getTalks()
    const found = items.find(i => i.title === 'How concision might save your life')
    expect(found).toBeDefined()
    expect(found?.tags || []).toEqual(['marketing', 'communication'])
  })
})
