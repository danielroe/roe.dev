<script setup lang="ts">
import { serialiseEditor } from './post-editor-serialise'
import type { DevRoeEntity } from '#shared/lex'

/**
 * contenteditable post editor for AMA threads. Stores text in a flat
 * string with `@<rkey>` placeholders for entity mentions and
 * `[label](url)` for links; renders those as inert chips in the DOM.
 *
 * The DOM is the source of truth while the user types: on every input
 * we serialise it back to the storage form and emit `update:modelValue`,
 * but we never re-render from storage mid-input (that would destroy the
 * caret). The parent's value is rendered once on mount and again only if
 * it changes externally to something the DOM doesn't already match.
 */

interface EntityEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeEntity.Record
}

const props = defineProps<{
  modelValue: string
  entities: EntityEntry[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLDivElement | null>(null)

const MENTION_RE = /@([a-z0-9]{13})\b/g
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g

function renderToDom (text: string) {
  if (!editorRef.value) return
  editorRef.value.replaceChildren()

  interface Match { start: number, end: number, kind: 'mention', rkey: string }
  interface LinkMatch { start: number, end: number, kind: 'link', label: string, url: string }
  type AnyMatch = Match | LinkMatch
  const matches: AnyMatch[] = []
  for (const m of text.matchAll(MENTION_RE)) {
    matches.push({ start: m.index!, end: m.index! + m[0].length, kind: 'mention', rkey: m[1]! })
  }
  for (const m of text.matchAll(LINK_RE)) {
    matches.push({ start: m.index!, end: m.index! + m[0].length, kind: 'link', label: m[1]!, url: m[2]! })
  }
  matches.sort((a, b) => a.start - b.start)

  let cursor = 0
  for (const m of matches) {
    if (m.start > cursor) {
      editorRef.value.appendChild(document.createTextNode(text.slice(cursor, m.start)))
    }
    if (m.kind === 'mention') {
      editorRef.value.appendChild(buildMentionChip(m.rkey))
    }
    else {
      editorRef.value.appendChild(buildLinkChip(m.label, m.url))
    }
    cursor = m.end
  }
  if (cursor < text.length) {
    editorRef.value.appendChild(document.createTextNode(text.slice(cursor)))
  }
}

function buildMentionChip (rkey: string): HTMLElement {
  const span = document.createElement('span')
  span.dataset.mentionRkey = rkey
  span.contentEditable = 'false'
  span.className = 'inline-block px-1.5 py-0.5 rounded bg-background text-primary text-sm mx-0.5'
  const entity = props.entities.find(e => e.rkey === rkey)
  span.textContent = entity ? `@${entity.value.name}` : `@${rkey}`
  return span
}

function buildLinkChip (label: string, url: string): HTMLElement {
  const a = document.createElement('a')
  a.dataset.linkUri = url
  a.contentEditable = 'false'
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.className = 'inline-block px-1.5 py-0.5 rounded bg-background text-primary underline underline-offset-2 text-sm mx-0.5'
  a.textContent = label
  return a
}

function serialiseFromDom (): string {
  return editorRef.value ? serialiseEditor(editorRef.value) : ''
}

function onInput () {
  emit('update:modelValue', serialiseFromDom())
}

function selectionInEditor (): Range | null {
  const editor = editorRef.value
  if (!editor) return null
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null
  return range
}

// Copy/cut write the storage form (`@<rkey>` / `[label](url)`) into
// `text/plain` so chips survive a round-trip through the OS clipboard.
// Without this, the browser's default serialiser keeps the chip's
// visible label (`@Vercel`) and drops the `data-mention-rkey` attribute
// on paste, silently turning the mention into plain text.
function writeSelectionToClipboard (event: ClipboardEvent) {
  const range = selectionInEditor()
  if (!range || !event.clipboardData) return
  const wrapper = document.createElement('div')
  wrapper.appendChild(range.cloneContents())
  const text = serialiseEditor(wrapper)
  event.clipboardData.setData('text/plain', text)
  event.preventDefault()
}

function onCopy (event: ClipboardEvent) {
  writeSelectionToClipboard(event)
}

function onCut (event: ClipboardEvent) {
  const range = selectionInEditor()
  if (!range) return
  writeSelectionToClipboard(event)
  range.deleteContents()
  onInput()
}

// Paste through the storage form: the source editor wrote `@<rkey>`
// into `text/plain`, so we insert that as text and then re-render the
// whole editor from the resulting serialised value, which rebuilds
// chips at the paste site.
function onPaste (event: ClipboardEvent) {
  const editor = editorRef.value
  if (!editor || !event.clipboardData) return
  const text = event.clipboardData.getData('text/plain')
  if (!text) return
  event.preventDefault()

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) {
    editor.appendChild(document.createTextNode(text))
  }
  else {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    range.setStartAfter(node)
    range.setEndAfter(node)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  const next = serialiseFromDom()
  renderToDom(next)
  // renderToDom rebuilds child nodes, so the previous range is detached.
  // Drop the caret at the end of the editor; matches default paste UX.
  const endRange = document.createRange()
  endRange.selectNodeContents(editor)
  endRange.collapse(false)
  const sel2 = window.getSelection()
  sel2?.removeAllRanges()
  sel2?.addRange(endRange)
  emit('update:modelValue', next)
}

function insertNode (node: Node) {
  const editor = editorRef.value
  if (!editor) return
  editor.focus()
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(node)
    range.setStartAfter(node)
    range.setEndAfter(node)
    sel.removeAllRanges()
    sel.addRange(range)
  }
  else {
    editor.appendChild(node)
  }
  // Append a trailing space so the next character isn't part of the chip.
  const space = document.createTextNode(' ')
  node.parentNode?.insertBefore(space, node.nextSibling)
  const sel2 = window.getSelection()
  if (sel2) {
    const range = document.createRange()
    range.setStartAfter(space)
    range.setEndAfter(space)
    sel2.removeAllRanges()
    sel2.addRange(range)
  }
  onInput()
}

function insertMention (entity: EntityEntry) {
  insertNode(buildMentionChip(entity.rkey))
}

function insertLink (label: string, url: string) {
  insertNode(buildLinkChip(label, url))
}

defineExpose({ insertMention, insertLink })

onMounted(() => {
  renderToDom(props.modelValue)
})

// Re-render only when the external value diverges from the DOM, so we
// don't fight the user's keystrokes.
watch(() => props.modelValue, next => {
  if (next === serialiseFromDom()) return
  renderToDom(next)
})
</script>

<template>
  <div
    ref="editorRef"
    contenteditable="true"
    role="textbox"
    aria-multiline="true"
    :data-placeholder="placeholder"
    class="bg-accent px-3 py-2 text-sm w-full min-h-[6rem] whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-muted"
    @input="onInput"
    @copy="onCopy"
    @cut="onCut"
    @paste="onPaste"
  />
</template>
