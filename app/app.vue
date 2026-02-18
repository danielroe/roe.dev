<template>
  <div
    id="app"
    class="overflow-x-hidden min-h-screen flex flex-col"
    :class="{ 'highlight-islands': highlightIslands }"
    @click="openSiteUI"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-background focus:rounded focus:font-medium"
    >
      Skip to main content
    </a>
    <LayoutTheSiteHeader />
    <NuxtPage />
    <LayoutThePresenceIndicator />
    <LayoutTheSiteFooter />
  </div>
</template>

<script lang="ts" setup>
import { joinURL, withoutTrailingSlash } from 'ufo'
import { links } from '~/utils/data'

const route = useRoute()

defineOgImageComponent('DefaultImage', {
  date: '',
  title: 'roe.dev',
  tags: [],
})

if (import.meta.server) {
  prerenderRoutes(joinURL('/__og-image__/static', route.path, 'og.png'))
}

// TODO: interactive components within server components
const highlightIslands = ref(false)
function openSiteUI (e: MouseEvent | KeyboardEvent) {
  if ((e.target as HTMLElement).hasAttribute('data-site-ui')) {
    highlightIslands.value = !highlightIslands.value
  }
}

useHead({
  title: () => (route.meta.title as string) || '',
  titleTemplate: title => (title ? `${title} - Daniel Roe` : 'Daniel Roe'),
  bodyAttrs: {
    class: 'font-sans',
  },
})

if (import.meta.server) {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': 'Daniel Roe',
    'url': 'https://roe.dev',
    'image': 'https://roe.dev/me.jpg',
    'jobTitle': 'Nuxt Core Team Lead',
    'worksFor': {
      '@type': 'Organization',
      'name': 'Vercel',
      'url': 'https://vercel.com',
    },
    'alumniOf': [
      {
        '@type': 'CollegeOrUniversity',
        'name': 'University of Oxford',
      },
      {
        '@type': 'CollegeOrUniversity',
        'name': 'Oak Hill College',
      },
    ],
    'knowsAbout': ['Vue.js', 'Nuxt', 'JavaScript', 'TypeScript', 'Web Performance', 'Serverless', 'Open Source'],
    'sameAs': [
      ...links.filter(link => link.link.startsWith('https://')).map(link => link.link),
      'https://x.com/danielcroe',
    ],
    'email': 'mailto:daniel@roe.dev',
    'homeLocation': {
      '@type': 'Place',
      'name': 'Scotland',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Daniel Roe',
    'url': 'https://roe.dev',
    'description': 'The personal website of Daniel Roe, Nuxt core team lead',
    'author': {
      '@type': 'Person',
      'name': 'Daniel Roe',
      'url': 'https://roe.dev',
    },
  }

  const PATH_RE = createRegExp(
    exactly(char.times.any().and(charNotIn('/')))
      .as('path')
      .and(exactly('/').optionally())
      .at.lineEnd(),
  )

  const { path = '/' } = route.fullPath.match(PATH_RE)?.groups ?? {}
  const url = withoutTrailingSlash(`https://roe.dev${path}`)

  useHead({
    meta: () => [
      { name: 'theme-color', content: '#1a202c' },
      { name: 'msapplication-TileColor', content: '#1a202c' },
      { property: 'og:url', content: url },
      {
        property: 'og:image',
        content: `https://roe.dev/__og-image__/static/og.png`,
        key: 'og:image',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '600' },
      {
        property: 'og:title',
        content: (route.meta.title as string) || 'Daniel Roe',
      },
      {
        name: 'description',
        content:
          (route.meta.description as string)
          || `The personal website of Daniel Roe`,
      },
      {
        property: 'og:description',
        content:
          (route.meta.description as string)
          || `The personal website of Daniel Roe`,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@danielcroe' },
      { name: 'twitter:creator', content: '@danielcroe' },
    ],
    link: [
      { rel: 'canonical', href: url },
      { rel: 'mask-icon', color: '#fff', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/svg', href: '/favicon.svg' },
      { rel: 'alternate', type: 'application/rss+xml', href: '/rss.xml' },
      { rel: 'alternate', type: 'text/markdown', href: `https://roe.dev${path === '/' ? '/index' : withoutTrailingSlash(path)}.md` },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#1a202c' },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(personSchema),
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(websiteSchema),
      },
    ],
  })
}
</script>

<style>
.highlight-islands [data-island] {
  border: 1px solid red;
}
</style>
