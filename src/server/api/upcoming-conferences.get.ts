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
    name: 'Vueconf US',
    dates: '15-17 May',
    link: 'https://vueconf.us/',
    location: '🇺🇸',
  },
  {
    name: 'DevHub North',
    dates: '30 May',
    image: {
      width: 940,
      height: 470,
      url: 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F764645019%2F354574849553%2F1%2Foriginal.20240510-143946?w=940&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C0%2C2160%2C1080&s=c344463499ccbb6cd3bc7664c63f6380',
    },
    link: 'https://www.eventbrite.co.uk/e/devhub-north-may-tickets-903193505087',
    location: '🇬🇧',
  },
  {
    name: 'Middlesborough FE',
    dates: '17 July',
    link: 'https://middlesbroughfe.co.uk/',
    location: '🇬🇧',
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
      const data = Buffer.from(res)
      const metadata = imageMeta(data)

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
