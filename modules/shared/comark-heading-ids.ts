import { defineComarkPlugin } from 'comark/parse'
import type { Node } from 'comark'

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function textContent (nodes: Node[]): string {
  let text = ''
  for (const node of nodes) {
    if (typeof node === 'string') {
      text += node
    }
    else if (Array.isArray(node)) {
      text += textContent(node.slice(2) as Node[])
    }
  }
  return text
}

function slugify (text: string) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  return /^\d/.test(slug) ? `_${slug}` : slug
}

/**
 * Rewrites heading `id`s so anchors match the slugs the site has always
 * published. Comark derives its ids from a text extraction that interpolates
 * the tag names of inline children (`## 1. Never let an LLM **speak** for you`
 * becomes `_1-never-let-an-llm-strong-speak-for-you`) and prefixes nested
 * headings with their parent's id. Both would break existing deep links.
 */
export const headingIds = defineComarkPlugin(() => ({
  name: 'heading-ids',
  post (state) {
    const counts = new Map<string, number>()

    const walk = (nodes: Node[]) => {
      for (const node of nodes) {
        if (!Array.isArray(node)) continue

        const [tag, props, ...children] = node
        if (typeof tag === 'string' && HEADINGS.has(tag) && props && typeof props === 'object') {
          const slug = slugify(textContent(children as Node[]))
          const count = counts.get(slug) ?? 0
          counts.set(slug, count + 1)
          ;(props as Record<string, unknown>).id = count > 0 ? `${slug}-${count}` : slug
        }

        walk(children as Node[])
      }
    }

    walk(state.tree.nodes)
  },
}))
