import { parseURL } from 'ufo'

/*! @__NO_SIDE_EFFECTS__ */
export const definePageMeta = (_args: any) => {}

export const useRoute = (_path?: string) => useNuxtApp().$route

export function handleNavigationClicks (e: MouseEvent | KeyboardEvent) {
  if (e.defaultPrevented) return

  if ('button' in e && e.button !== 0) return
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return

  const anchor = (e.target as HTMLElement).closest('a')
  if (!anchor) return

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

  e.preventDefault()
  return navigateTo(url.pathname + (url.search || '') + (url.hash || ''))
}
