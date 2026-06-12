/**
 * Serialise the PostEditor contenteditable DOM back to its flat-text
 * storage form (`@<rkey>` for entity mentions, `[label](url)` for
 * inline links, `\n` for line breaks). Exported so it can be unit
 * tested against fixtures built with happy-dom; the component holds the
 * editor element, this function holds the rules.
 */

function serialiseNode (node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (!(node instanceof HTMLElement)) return ''

  if (node.dataset.mentionRkey) {
    return `@${node.dataset.mentionRkey}`
  }
  if (node.dataset.linkUri) {
    return `[${node.textContent ?? ''}](${node.dataset.linkUri})`
  }
  if (node.tagName === 'BR') {
    return '\n'
  }

  let inner = ''
  for (const child of node.childNodes) inner += serialiseNode(child)

  // Browsers wrap newlines in <div>/<p> on Enter, and may nest chips
  // inside them. Recursing keeps chip semantics across line breaks.
  if (node.tagName === 'DIV' || node.tagName === 'P') {
    return (inner.startsWith('\n') ? '' : '\n') + inner
  }
  return inner
}

export function serialiseEditor (root: HTMLElement): string {
  let out = ''
  for (const node of root.childNodes) out += serialiseNode(node)
  return out.replace(/^\n+/, '')
}
