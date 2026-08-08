import { parseURL } from 'ufo'

import { isSlowConnection, useObserver } from './nuxt-link'

function resolveInternalPath (anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute('download')) return
  const target = anchor.getAttribute('target')
  if (target && target !== '_self') return
  if ('external' in anchor.dataset) return

  const href = anchor.getAttribute('href')
  if (!href) return
  // Schemes the browser should handle natively (mailto:, tel:, etc.).
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !/^https?:/i.test(href)) return

  const url = parseURL(href)
  if (url.host && url.host !== window.location.host) return

  return url.pathname + (url.search || '') + (url.hash || '')
}

export default defineNuxtPlugin(nuxtApp => {
  document.addEventListener('click', e => {
    if (e.defaultPrevented) return

    if (e.button !== 0) return
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return

    const anchor = (e.target as HTMLElement | null)?.closest('a')
    if (!anchor) return

    const path = resolveInternalPath(anchor)
    if (!path) return

    e.preventDefault()
    return navigateTo(path)
  })

  if (isSlowConnection()) return

  const unobservers = new Map<Element, () => void>()

  function observeAnchors (root: Element) {
    const observer = useObserver()
    if (!observer) return

    const anchors = [...root.querySelectorAll<HTMLAnchorElement>('a[href]')]
    if (root.matches('a[href]')) anchors.push(root as HTMLAnchorElement)

    for (const anchor of anchors) {
      if (unobservers.has(anchor)) continue
      const unobserve = observer.observe(anchor, () => {
        unobservers.get(anchor)?.()
        unobservers.delete(anchor)
        const path = resolveInternalPath(anchor)
        if (!path) return
        Promise.resolve(nuxtApp.hooks.callHook('link:prefetch', path)).catch(() => {})
      })
      unobservers.set(anchor, unobserve)
    }
  }

  function unobserveAnchors (root: Element) {
    for (const [anchor, unobserve] of unobservers) {
      if (root.contains(anchor)) {
        unobserve()
        unobservers.delete(anchor)
      }
    }
  }

  onNuxtReady(() => {
    observeAnchors(document.body)
    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node.nodeType === 1) unobserveAnchors(node as Element)
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) observeAnchors(node as Element)
        }
      }
    }).observe(document.body, { childList: true, subtree: true })
  })
})
