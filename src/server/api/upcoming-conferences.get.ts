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
      name: 'Vue.js Amsterdam',
      dates: '28-29 February',
      link: 'https://vuejs.amsterdam/',
      location: '🇳🇱',
    },
    {
      name: 'EdinburghJS',
      dates: '19 March',
      link: 'https://www.edinburghjs.org/',
      location: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      image: {
        url: 'https://secure.meetupstatic.com/photos/event/3/9/b/2/clean_515474770.webp',
        width: 653,
        height: 367
      }
    },
    {
      name: 'CityJS London',
      dates: '3-5 April',
      link: 'https://london.cityjsconf.org/',
      location: '🇬🇧',
    },
    {
      name: 'Vue.js Live',
      dates: '25-26 April',
      link: 'https://vuejslive.com/',
      location: '🌍',
    },
    {
      name: 'Vueconf US',
      dates: '15-17 May',
      link: 'https://vueconf.us/',
      location: '🇺🇸',
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
        /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/
      )?.[1]

      if (!ogImage) {
        return {
          ...conference,
          image: {
            url: null,
            width: null,
            height: null,
          }
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
    })
  )
})
