import { imageMeta } from 'image-meta'

const upcomingConferences: Array<{
  name: string
  dates: string
  link: string
  location: string
}> = [
    {
      name: 'Vue.js Nation',
      dates: '24-25 January',
      link: 'https://vuejsnation.com/',
      location: '🌍',
    },
    {
      name: 'Vue.js Amsterdam',
      dates: '28-29 February',
      link: 'https://vuejs.amsterdam/',
      location: '🇳🇱',
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

export default defineEventHandler(async () => {
  return Promise.all(
    upcomingConferences.map(async conference => {
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
