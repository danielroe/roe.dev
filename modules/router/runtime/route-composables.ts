import { parseURL } from 'ufo'

/*! @__NO_SIDE_EFFECTS__ */
export const definePageMeta = (_args: any) => {}

export const useRoute = (_path?: string) => useNuxtApp().$route

export function handleNavigationClicks (e: MouseEvent | KeyboardEvent) {
  const anchor = (e.target as HTMLElement).closest('a')
  if (anchor) {
    const href = anchor.getAttribute('href')
    if (href) {
      e.preventDefault()
      const url = parseURL(href)
      if (
        !('external' in anchor.dataset)
        && (!url.host || url.host === window.location.host)
      ) {
        return navigateTo(url.pathname)
      }

      return navigateTo(href, { external: true })
    }
  }
}
