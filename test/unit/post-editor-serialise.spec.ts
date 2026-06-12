import { describe, it, expect, beforeAll } from 'vitest'
import { Window } from 'happy-dom'

import { serialiseEditor } from '../../app/components/admin/post-editor-serialise'

let window: Window
let document: Window['document']

beforeAll(() => {
  window = new Window()
  document = window.document
  // happy-dom doesn't expose Node/HTMLElement as globals by default, but
  // the serialiser relies on `instanceof HTMLElement` and the `Node`
  // constants. Mirror them onto the global scope for the duration of
  // the tests.
  for (const key of ['Node', 'HTMLElement', 'Text']) {
    // @ts-expect-error - test-only globals
    globalThis[key] = window[key]
  }
})

function mentionChip (rkey: string, label: string): HTMLElement {
  const span = document.createElement('span')
  span.dataset.mentionRkey = rkey
  span.textContent = label
  return span as unknown as HTMLElement
}

function linkChip (label: string, url: string): HTMLElement {
  const a = document.createElement('a')
  a.dataset.linkUri = url
  a.textContent = label
  return a as unknown as HTMLElement
}

function editor (build: (root: HTMLElement) => void): HTMLElement {
  const root = document.createElement('div')
  build(root as unknown as HTMLElement)
  return root as unknown as HTMLElement
}

describe('serialiseEditor', () => {
  it('serialises plain text', () => {
    const root = editor(r => {
      r.appendChild(document.createTextNode('hello world'))
    })
    expect(serialiseEditor(root)).toBe('hello world')
  })

  it('serialises mention chips as @<rkey>', () => {
    const root = editor(r => {
      r.appendChild(document.createTextNode('hi '))
      r.appendChild(mentionChip('abcdefghijklm', '@Vercel'))
      r.appendChild(document.createTextNode(' team'))
    })
    expect(serialiseEditor(root)).toBe('hi @abcdefghijklm team')
  })

  it('serialises link chips as [label](url)', () => {
    const root = editor(r => {
      r.appendChild(document.createTextNode('see '))
      r.appendChild(linkChip('docs', 'https://example.com'))
    })
    expect(serialiseEditor(root)).toBe('see [docs](https://example.com)')
  })

  it('treats <br> as newline', () => {
    const root = editor(r => {
      r.appendChild(document.createTextNode('one'))
      r.appendChild(document.createElement('br'))
      r.appendChild(document.createTextNode('two'))
    })
    expect(serialiseEditor(root)).toBe('one\ntwo')
  })

  it('preserves chip semantics inside <div> wrappers (Enter creates a new line)', () => {
    // Chrome's contenteditable wraps the new line in a <div> when the
    // user presses Enter. If the mention chip ends up inside that <div>
    // the serialiser must keep emitting `@<rkey>`, not the visible
    // `@Vercel` text content.
    const root = editor(r => {
      r.appendChild(document.createTextNode('first line'))
      const div = document.createElement('div')
      div.appendChild(document.createTextNode('as I work at '))
      div.appendChild(mentionChip('abcdefghijklm', '@Vercel'))
      div.appendChild(document.createTextNode(', ...'))
      r.appendChild(div)
    })
    expect(serialiseEditor(root)).toBe('first line\nas I work at @abcdefghijklm, ...')
  })

  it('preserves link chips inside <div> wrappers', () => {
    const root = editor(r => {
      const div = document.createElement('div')
      div.appendChild(document.createTextNode('see '))
      div.appendChild(linkChip('docs', 'https://example.com'))
      r.appendChild(div)
    })
    expect(serialiseEditor(root)).toBe('see [docs](https://example.com)')
  })

  it('joins consecutive <div> blocks with newlines', () => {
    const root = editor(r => {
      const a = document.createElement('div')
      a.appendChild(document.createTextNode('one'))
      const b = document.createElement('div')
      b.appendChild(document.createTextNode('two'))
      r.appendChild(a)
      r.appendChild(b)
    })
    expect(serialiseEditor(root)).toBe('one\ntwo')
  })

  it('handles empty editor', () => {
    const root = editor(() => {})
    expect(serialiseEditor(root)).toBe('')
  })

  it('serialises a cloned selection fragment (copy/cut path)', () => {
    // The copy/cut handler clones the selection into a fresh wrapper
    // and runs it through the same serialiser. Confirm a fragment
    // containing just a chip + trailing text round-trips.
    const root = editor(r => {
      r.appendChild(document.createTextNode('hi '))
      r.appendChild(mentionChip('abcdefghijklm', '@Vercel'))
      r.appendChild(document.createTextNode(' team'))
    })
    const wrapper = document.createElement('div')
    while (root.firstChild) wrapper.appendChild(root.firstChild)
    expect(serialiseEditor(wrapper as unknown as HTMLElement))
      .toBe('hi @abcdefghijklm team')
  })
})
