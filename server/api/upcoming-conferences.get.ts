import { imageMeta } from 'image-meta'

const upcomingConferences: Array<{
  name: string
  dates: string
  link: string
  image?: {
    url: string
    width: number
    height: number
  }
  location: string
}> = [
  {
    name: 'performance.now()',
    dates: '14-15 November',
    link: 'https://perfnow.nl/',
    location: '🇳🇱',
  },
  {
    name: 'Vue Toronto',
    dates: '18-20 November',
    link: 'https://www.vuetoronto.com/',
    location: '🇨🇦',
  },
]

export default defineCachedEventHandler(async () => {
  if (!import.meta.dev && !import.meta.prerender) return []

  return Promise.all(
    upcomingConferences.map(async conference => {
      if (conference.image) {
        return conference as Omit<typeof conference, 'image'> & { image: NonNullable<typeof conference.image> }
      }
      const html = await $fetch<string>(conference.link)
      const ogImage = html.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/,
      )?.[1]

      if (!ogImage) {
        return {
          ...conference,
          image: {
            url: null,
            width: null,
            height: null,
          },
        }
      }

      // if (import.meta.dev) {
      //   return {
      //     ...conference,
      //     image: {
      //       url: ogImage,
      //       width: 1200,
      //       height: 630,
      //     },
      //   }
      // }

      const res = await $fetch(ogImage!, { responseType: 'arrayBuffer' }) as ArrayBuffer
      const metadata = imageMeta(new Uint8Array(res))

      return {
        ...conference,
        image: {
          url: ogImage,
          width: metadata.width,
          height: metadata.height,
        },
      }
    }),
  )
})
